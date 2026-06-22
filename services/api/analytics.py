import datetime
import time

_board_analytics_cache = None
MAX_ANALYTICS_POINTS_PER_TILE = 1000

def clear_board_analytics_cache():
  global _board_analytics_cache
  _board_analytics_cache = None

def get_board_analytics(collection, cache_seconds):
  """Return cached, aggregate-only Bingo stats for the health endpoint."""
  global _board_analytics_cache

  now = time.monotonic()
  if _board_analytics_cache and _board_analytics_cache['expires_at'] > now:
    return _board_analytics_cache['data']

  current_time = datetime.datetime.now()
  last_24_hours = current_time - datetime.timedelta(hours=24)
  last_7_days = current_time - datetime.timedelta(days=7)
  last_30_days = current_time - datetime.timedelta(days=30)

  # Team state is stored under dynamic `team-*` keys. These stages retain only
  # teams with a checked tile, so progress analytics do not treat untouched
  # boards or empty teams as activity.
  pipeline = [
    {
      '$project': {
        'board_type': {'$ifNull': ['$boardType', 'osrs']},
        'created_at': '$date',
        'stored_rows': {'$convert': {'input': '$rows', 'to': 'int', 'onError': 0, 'onNull': 0}},
        'stored_columns': {'$convert': {'input': '$columns', 'to': 'int', 'onError': 0, 'onNull': 0}},
        'board_data': {'$cond': [{'$isArray': '$boardData'}, '$boardData', []]},
        'team_fields': {
          '$filter': {
            'input': {'$objectToArray': '$$ROOT'},
            'as': 'field',
            'cond': {
              '$and': [
                {'$regexMatch': {'input': '$$field.k', 'regex': '^team-'}},
                {'$eq': [{'$type': '$$field.v.teamData'}, 'array']},
              ],
            },
          },
        },
      },
    },
    {
      '$project': {
        'board_type': 1,
        'created_at': 1,
        'stored_rows': 1,
        'stored_columns': 1,
        'actual_columns': {'$size': '$board_data'},
        'actual_rows': {
          '$let': {
            'vars': {'first_column': {'$arrayElemAt': ['$board_data', 0]}},
            'in': {
              '$cond': [
                {'$isArray': '$$first_column'},
                {'$size': '$$first_column'},
                0,
              ],
            },
          },
        },
        'team_tiles_by_team': {
          '$map': {
            'input': '$team_fields',
            'as': 'team',
            'in': {
              '$reduce': {
                'input': {
                  '$zip': {
                    'inputs': ['$$team.v.teamData', '$board_data'],
                  },
                },
                'initialValue': [],
                'in': {
                  '$concatArrays': [
                    '$$value',
                    {
                      '$map': {
                        'input': {
                          '$zip': {
                            'inputs': [
                              {'$arrayElemAt': ['$$this', 0]},
                              {'$arrayElemAt': ['$$this', 1]},
                            ],
                          },
                        },
                        'as': 'tile_pair',
                        'in': {
                          'team': {'$arrayElemAt': ['$$tile_pair', 0]},
                          'board': {'$arrayElemAt': ['$$tile_pair', 1]},
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      },
    },
    {
      '$project': {
        'board_type': 1,
        'created_at': 1,
        'rows': {
          '$cond': [
            {'$and': [{'$gt': ['$actual_rows', 0]}, {'$gt': ['$actual_columns', 0]}]},
            '$actual_rows',
            '$stored_rows',
          ],
        },
        'columns': {
          '$cond': [
            {'$and': [{'$gt': ['$actual_rows', 0]}, {'$gt': ['$actual_columns', 0]}]},
            '$actual_columns',
            '$stored_columns',
          ],
        },
        'active_team_tiles': {
          '$filter': {
            'input': '$team_tiles_by_team',
            'as': 'team_tiles',
            'cond': {
              '$gt': [
                {
                  '$size': {
                    '$filter': {
                      'input': '$$team_tiles',
                      'as': 'tile',
                      'cond': {'$eq': [{'$ifNull': ['$$tile.team.checked', False]}, True]},
                    },
                  },
                },
                0,
              ],
            },
          },
        },
      },
    },
    {
      '$project': {
        'board_type': 1,
        'created_at': 1,
        'rows': 1,
        'columns': 1,
        'board_tiles': {'$multiply': ['$rows', '$columns']},
        'team_count': {'$size': '$active_team_tiles'},
        'has_done_activity': {'$gt': [{'$size': '$active_team_tiles'}, 0]},
        'team_tiles': {
          '$reduce': {
            'input': '$active_team_tiles',
            'initialValue': [],
            'in': {'$concatArrays': ['$$value', '$$this']},
          },
        },
      },
    },
    {
      '$project': {
        'board_type': 1,
        'created_at': 1,
        'rows': 1,
        'columns': 1,
        'team_count': 1,
        'has_done_activity': 1,
        'board_tiles': 1,
        'team_tile_count': {'$size': '$team_tiles'},
        'completed_tiles': {
          '$size': {
            '$filter': {
              'input': '$team_tiles',
              'as': 'tile',
              'cond': {'$eq': [{'$ifNull': ['$$tile.team.checked', False]}, True]},
            },
          },
        },
        'proof_notes': {
          '$size': {
            '$filter': {
              'input': '$team_tiles',
              'as': 'tile',
              'cond': {'$ne': [{'$ifNull': ['$$tile.team.proof', '']}, '']},
            },
          },
        },
        'proof_images': {
          '$sum': {
            '$map': {
              'input': '$team_tiles',
              'as': 'tile',
              'in': {
                '$cond': [
                  {'$isArray': '$$tile.team.proofImages'},
                  {'$size': '$$tile.team.proofImages'},
                  0,
                ],
              },
            },
          },
        },
        'points_earned': {
          '$sum': {
            '$map': {
              'input': '$team_tiles',
              'as': 'tile',
              'in': {
                '$let': {
                  'vars': {
                    'claimed': {
                      '$convert': {
                        'input': '$$tile.team.currPoints',
                        'to': 'double',
                        'onError': 0,
                        'onNull': 0,
                      },
                    },
                    'available': {
                      '$convert': {
                        'input': '$$tile.board.points',
                        'to': 'double',
                        'onError': 0,
                        'onNull': 0,
                      },
                    },
                  },
                  'in': {
                    '$cond': [
                      {
                        '$and': [
                          {'$gte': ['$$claimed', 0]},
                          {'$gte': ['$$available', 0]},
                        ],
                      },
                      {'$min': ['$$claimed', '$$available', MAX_ANALYTICS_POINTS_PER_TILE]},
                      0,
                    ],
                  },
                },
              },
            },
          },
        },
      },
    },
    {
      '$facet': {
        'summary': [
          {
            '$group': {
              '_id': None,
              'boards': {'$sum': 1},
              'created_last_24h': {'$sum': {'$cond': [{'$gte': ['$created_at', last_24_hours]}, 1, 0]}},
              'created_last_7d': {'$sum': {'$cond': [{'$gte': ['$created_at', last_7_days]}, 1, 0]}},
              'created_last_30d': {'$sum': {'$cond': [{'$gte': ['$created_at', last_30_days]}, 1, 0]}},
              'boards_with_progress': {'$sum': {'$cond': ['$has_done_activity', 1, 0]}},
              'total_board_tiles': {'$sum': {'$cond': ['$has_done_activity', '$board_tiles', 0]}},
              'average_board_tiles': {'$avg': {'$cond': ['$has_done_activity', '$board_tiles', None]}},
              'largest_board_tiles': {'$max': {'$cond': ['$has_done_activity', '$board_tiles', None]}},
              'total_teams': {'$sum': '$team_count'},
              'total_team_tiles': {'$sum': '$team_tile_count'},
              'completed_tiles': {'$sum': '$completed_tiles'},
              'proof_notes': {'$sum': '$proof_notes'},
              'proof_images': {'$sum': '$proof_images'},
              'points_earned': {'$sum': '$points_earned'},
            },
          },
        ],
        'board_types': [
          {'$match': {'has_done_activity': True}},
          {'$group': {'_id': '$board_type', 'boards': {'$sum': 1}}},
          {'$sort': {'boards': -1, '_id': 1}},
        ],
        'popular_layouts': [
          {'$match': {'has_done_activity': True, 'board_tiles': {'$gt': 0}}},
          {
            '$group': {
              '_id': {'rows': '$rows', 'columns': '$columns'},
              'boards': {'$sum': 1},
            },
          },
          {'$sort': {'boards': -1, '_id.rows': 1, '_id.columns': 1}},
          {'$limit': 3},
        ],
      },
    },
  ]

  aggregate_result = next(collection.aggregate(pipeline), {})
  summary = aggregate_result.get('summary', [{}])[0] or {}
  active_board_count = summary.get('boards_with_progress', 0)
  team_tile_count = summary.get('total_team_tiles', 0)
  completed_tile_count = summary.get('completed_tiles', 0)

  analytics = {
    'board_types': {
      entry['_id']: entry['boards']
      for entry in aggregate_result.get('board_types', [])
      if entry.get('_id') is not None
    },
    'created': {
      'last_24h': summary.get('created_last_24h', 0),
      'last_7d': summary.get('created_last_7d', 0),
      'last_30d': summary.get('created_last_30d', 0),
    },
    'activity': {
      'boards_with_progress': active_board_count,
    },
    'board_tiles': {
      'total': summary.get('total_board_tiles', 0),
      'average_per_board': round(summary.get('average_board_tiles') or 0, 1),
      'largest_board': summary.get('largest_board_tiles') or 0,
    },
    'teams': {
      'total': summary.get('total_teams', 0),
      'average_per_board': round(summary.get('total_teams', 0) / active_board_count, 1) if active_board_count else 0,
    },
    'progress': {
      'team_tiles': team_tile_count,
      'completed_tiles': completed_tile_count,
      'completion_percentage': round(100 * completed_tile_count / team_tile_count, 1) if team_tile_count else 0,
      'proof_notes': summary.get('proof_notes', 0),
      'proof_images': summary.get('proof_images', 0),
      'points_earned': summary.get('points_earned', 0),
    },
    'popular_layouts': [
      {
        'rows': entry['_id']['rows'],
        'columns': entry['_id']['columns'],
        'boards': entry['boards'],
      }
      for entry in aggregate_result.get('popular_layouts', [])
    ],
  }
  _board_analytics_cache = {
    'data': analytics,
    'expires_at': now + cache_seconds,
  }
  return analytics


