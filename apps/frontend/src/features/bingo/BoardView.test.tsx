import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import BoardView from './BoardView';

class TestEventSource {
  static instances: TestEventSource[] = [];
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: (() => void) | null = null;
  onopen: (() => void) | null = null;

  constructor() {
    TestEventSource.instances.push(this);
  }

  close() {}
}

const tile = {
  title: 'Boss task',
  description: 'Defeat the boss',
  points: 100,
  image: null,
  rowBingo: 0,
  colBingo: 0,
};

function boardResponse(size = 2, teams = 1) {
  return {
    boardData: Array.from({ length: size }, (_, column) =>
      Array.from({ length: size }, (_, row) =>
        column === 0 && row === 0 ? tile : { ...tile, title: `Tile ${column}-${row}` }
      )
    ),
    boardMutationRevision: size === 2 ? 1 : 2,
    boardSettingsRevision: size === 2 ? 1 : 2,
    boardType: 'osrs',
    generalPassword: 'general-password',
    teamData: Array.from({ length: teams }, (_, team) => ({
      team,
      data: {
        name: `team-${team}`,
        teamData: Array.from({ length: size }, () =>
          Array.from({ length: size }, () => ({
            checked: false,
            currPoints: 25,
            proof: '',
            proofImages: [],
          }))
        ),
      },
    })),
    teamPasswordsRequired: false,
    visibleRows: size,
  };
}

function responseBody(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  localStorage.clear();
  TestEventSource.instances = [];
  vi.unstubAllGlobals();
});

test('defers a structural SSE refresh while a tile draft is open', async () => {
  const responses = [boardResponse(2, 2), boardResponse(1), boardResponse(1)];
  const fetchMock = vi.fn(() =>
    Promise.resolve(
      new Response(JSON.stringify(responses.shift()), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )
  );
  vi.stubGlobal('fetch', fetchMock);
  vi.stubGlobal('EventSource', TestEventSource);

  render(
    <MemoryRouter
      initialEntries={[
        {
          pathname: '/bingo/TestBoard',
          state: {
            privilege: 'general',
            generalPassword: 'general-password',
            boardName: 'TestBoard',
            activeTeamIndex: 1,
          },
        },
      ]}
    >
      <Routes>
        <Route path="/bingo/:boardName" element={<BoardView />} />
      </Routes>
    </MemoryRouter>
  );

  await waitFor(() =>
    expect(screen.getByRole('button', { name: /Open Tile 1-1/i })).toBeInTheDocument()
  );
  fireEvent.click(screen.getByRole('button', { name: /Open Tile 1-1/i }));
  const currentPoints = screen.getByLabelText(/Current Points/i);
  fireEvent.change(currentPoints, { target: { value: '20' } });

  const eventSource = TestEventSource.instances[0];
  expect(eventSource).toBeDefined();
  eventSource?.onmessage?.({} as MessageEvent);

  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(screen.getByLabelText(/Current Points/i)).toHaveValue('20');
  expect(within(screen.getByRole('dialog')).getByText('Tile 1-1')).toBeInTheDocument();

  fireEvent.click(screen.getAllByRole('button', { name: 'Close' })[1]);
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
  await waitFor(() =>
    expect(screen.queryByRole('button', { name: /Open Tile 1-1/i })).not.toBeInTheDocument()
  );
  expect(screen.getByRole('tab', { name: /team-0/ })).toBeInTheDocument();
});

test('does not close a draft when a newer SSE refresh fails', async () => {
  let resolveInitial!: (response: Response) => void;
  let resolveReload!: (response: Response) => void;
  let boardGets = 0;
  const fetchMock = vi.fn((input: RequestInfo | URL, _init?: RequestInit) => {
    const url = String(input);
    if (url.includes('/getBoard/')) {
      boardGets += 1;
      if (boardGets === 1) {
        return new Promise<Response>((resolve) => {
          resolveInitial = resolve;
        });
      }
      if (boardGets === 2) {
        return new Promise<Response>((resolve) => {
          resolveReload = resolve;
        });
      }
      return Promise.resolve(
        responseBody({ error: 'unavailable', message: 'refresh failed' }, 500)
      );
    }
    if (url.includes('/updateBoard/')) {
      return Promise.resolve(
        responseBody({ error: 'conflict', message: 'Tile changed elsewhere.' }, 409)
      );
    }
    return Promise.reject(new Error(`unexpected fetch ${url}`));
  });
  vi.stubGlobal('fetch', fetchMock);
  vi.stubGlobal('EventSource', TestEventSource);

  render(
    <MemoryRouter
      initialEntries={[
        {
          pathname: '/bingo/TestBoard',
          state: {
            privilege: 'general',
            generalPassword: 'general-password',
            boardName: 'TestBoard',
          },
        },
      ]}
    >
      <Routes>
        <Route path="/bingo/:boardName" element={<BoardView />} />
      </Routes>
    </MemoryRouter>
  );

  await waitFor(() => expect(boardGets).toBe(1));
  resolveInitial(responseBody(boardResponse()));
  await waitFor(() =>
    expect(screen.getByRole('button', { name: /Open Tile 1-1/i })).toBeInTheDocument()
  );
  fireEvent.click(screen.getByRole('button', { name: /Open Tile 1-1/i }));
  fireEvent.change(screen.getByLabelText(/Current Points/i), { target: { value: '20' } });
  fireEvent.click(screen.getByRole('button', { name: /^Save$/i }));
  const updateCall = fetchMock.mock.calls.find(([input]) =>
    String(input).includes('/updateBoard/')
  );
  expect(updateCall).toBeDefined();
  expect(JSON.parse(String(updateCall?.[1]?.body))).toMatchObject({
    col: 1,
    expectedBoardTileRevision: 0,
    expectedRevision: 0,
    expectedSettingsRevision: 1,
    info: expect.objectContaining({ teamId: 0 }),
    row: 1,
  });
  await waitFor(() =>
    expect(within(screen.getByRole('dialog')).getByRole('alert')).toHaveTextContent(
      /Tile changed elsewhere/i
    )
  );

  fireEvent.click(screen.getByRole('button', { name: /Discard draft and reload/i }));
  await waitFor(() => expect(boardGets).toBe(2));
  TestEventSource.instances[0]?.onmessage?.({} as MessageEvent);
  await waitFor(() => expect(boardGets).toBe(3));

  resolveReload(responseBody(boardResponse(1)));
  await waitFor(() => {
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('alert')).toHaveTextContent(
      /Could not load the latest tile data/i
    );
    expect(within(dialog).getByRole('button', { name: /Discard draft and reload/i })).toBeEnabled();
  });
  expect(screen.getByLabelText(/Current Points/i)).toHaveValue('20');
  expect(screen.getByRole('button', { name: /Discard draft and reload/i })).toBeInTheDocument();
});

test('refreshes and closes after saving a dirty board-settings draft', async () => {
  let boardGets = 0;
  const initial = boardResponse();
  const refreshed = boardResponse();
  refreshed.boardSettingsRevision = 2;
  refreshed.boardMutationRevision = 2;
  refreshed.teamData[0].data.name = 'Renamed team';

  const fetchMock = vi.fn((input: RequestInfo | URL, _init?: RequestInit) => {
    const url = String(input);
    if (url.includes('/getBoard/')) {
      boardGets += 1;
      return Promise.resolve(responseBody(boardGets === 1 ? initial : refreshed));
    }
    if (url.includes('/updateTeams/')) {
      return Promise.resolve(responseBody({ success: true, boardSettingsRevision: 2 }));
    }
    return Promise.reject(new Error(`unexpected fetch ${url}`));
  });
  vi.stubGlobal('fetch', fetchMock);
  vi.stubGlobal('EventSource', TestEventSource);

  render(
    <MemoryRouter
      initialEntries={[
        {
          pathname: '/bingo/TestBoard',
          state: {
            privilege: 'admin',
            adminPassword: 'admin-password',
            boardName: 'TestBoard',
            cameFromCreate: true,
          },
        },
      ]}
    >
      <Routes>
        <Route path="/bingo/:boardName" element={<BoardView />} />
      </Routes>
    </MemoryRouter>
  );

  fireEvent.click(await screen.findByRole('button', { name: /Edit Board/i }));
  fireEvent.click(screen.getByRole('tab', { name: /Teams/i }));
  fireEvent.change(screen.getByDisplayValue('team-0'), { target: { value: 'Renamed team' } });
  fireEvent.click(screen.getByRole('button', { name: /^Save$/i }));

  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(boardGets).toBe(2);
  const updateCall = fetchMock.mock.calls.find(([input]) =>
    String(input).includes('/updateTeams/')
  );
  expect(JSON.parse(String(updateCall?.[1]?.body))).toMatchObject({
    dataToSend: {
      expectedSettingsRevision: 1,
      teamData: [
        expect.objectContaining({ data: expect.objectContaining({ name: 'Renamed team' }) }),
      ],
    },
  });
});
