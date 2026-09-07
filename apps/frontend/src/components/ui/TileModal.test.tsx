import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { beforeEach, expect, test, vi } from 'vitest';
import TileModal from './TileModal';
import { SaveConflictError } from '../../utils/utils';

type TileModalProps = ComponentProps<typeof TileModal>;

const baseInfo = {
  title: 'Dragon task',
  description: 'Kill the dragon',
  points: 50,
} satisfies TileModalProps['info'];

const baseTeamInfo = {
  checked: false,
  currPoints: 10,
  proof: '',
} satisfies TileModalProps['teamInfo'];

function renderTileModal(overrides: Partial<TileModalProps> = {}) {
  const change = vi.fn().mockResolvedValue(true);
  const handleClose = vi.fn();
  const props = {
    cord: [1, 2],
    change,
    handleClose,
    info: baseInfo,
    teamInfo: baseTeamInfo,
    privilege: 'member',
    show: true,
    ...overrides,
  } satisfies TileModalProps;

  const rendered = render(<TileModal {...props} />);

  return {
    ...props,
    change,
    handleClose,
    rerender: (nextProps: Partial<TileModalProps>) =>
      rendered.rerender(<TileModal {...props} {...nextProps} />),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

test('toggles completed and saves member progress', async () => {
  const props = renderTileModal();
  const completed = screen.getByLabelText(/Completed\?/i);

  expect(completed).toBeVisible();
  expect(completed).toHaveClass('tm-check-input');
  expect(completed).not.toBeChecked();

  fireEvent.click(completed);
  expect(completed).toBeChecked();

  fireEvent.click(screen.getByRole('button', { name: /Save/i }));

  await waitFor(() => expect(props.change).toHaveBeenCalled());
  expect(props.change).toHaveBeenCalledWith(
    1,
    2,
    expect.objectContaining({
      checked: true,
      currPoints: 50,
      proof: '',
    }),
    expect.objectContaining({
      expectedBoardTileRevision: 0,
      expectedRevision: 0,
      expectedSettingsRevision: 0,
      teamId: undefined,
    })
  );
  expect(props.handleClose).toHaveBeenCalled();
});

test('keeps the draft open when the parent reports a failed save', async () => {
  const change = vi.fn().mockResolvedValue(false);
  const props = renderTileModal({ change });
  const currentPoints = screen.getByLabelText(/Current Points/i);

  fireEvent.change(currentPoints, { target: { value: '20' } });
  fireEvent.click(screen.getByRole('button', { name: /Save/i }));

  await waitFor(() => expect(change).toHaveBeenCalled());
  expect(props.handleClose).not.toHaveBeenCalled();
  expect(currentPoints).toHaveValue('20');
});

test('shows a retryable error when the parent save rejects', async () => {
  const change = vi.fn().mockRejectedValue(new Error('network error'));
  const props = renderTileModal({ change });
  const currentPoints = screen.getByLabelText(/Current Points/i);

  fireEvent.change(currentPoints, { target: { value: '20' } });
  fireEvent.click(screen.getByRole('button', { name: /Save/i }));

  await waitFor(() => {
    expect(screen.getByRole('alert')).toHaveTextContent(/Could not save this tile/i);
  });
  expect(props.handleClose).not.toHaveBeenCalled();
  expect(currentPoints).toHaveValue('20');
  expect(screen.getByRole('button', { name: /Save/i })).toBeEnabled();
});

test('keeps tile drafts on conflict and offers to load the latest data', async () => {
  const change = vi.fn().mockRejectedValue(new SaveConflictError('Tile changed elsewhere.'));
  const onConflictReload = vi.fn().mockResolvedValue(true);
  const props = renderTileModal({
    boardSettingsRevision: 4,
    change,
    info: { ...baseInfo, revision: 7 },
    onConflictReload,
    teamId: 0,
    teamInfo: { ...baseTeamInfo, revision: 3 },
  });

  fireEvent.change(screen.getByLabelText(/Current Points/i), { target: { value: '20' } });
  fireEvent.click(screen.getByRole('button', { name: /Save/i }));

  await waitFor(() => {
    expect(screen.getByRole('alert')).toHaveTextContent(/Tile changed elsewhere/i);
  });
  expect(change).toHaveBeenCalledWith(
    1,
    2,
    expect.anything(),
    expect.objectContaining({
      expectedBoardTileRevision: 7,
      expectedRevision: 3,
      expectedSettingsRevision: 4,
      teamId: 0,
    })
  );
  expect(props.handleClose).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole('button', { name: /Discard draft and reload/i }));
  await waitFor(() => expect(onConflictReload).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(props.handleClose).toHaveBeenCalledTimes(1));
});

test('keeps the tile draft when loading the latest data fails', async () => {
  const change = vi.fn().mockRejectedValue(new SaveConflictError('Tile changed elsewhere.'));
  const onConflictReload = vi.fn().mockResolvedValue(false);
  const props = renderTileModal({ change, onConflictReload });
  const currentPoints = screen.getByLabelText(/Current Points/i);

  fireEvent.change(currentPoints, { target: { value: '20' } });
  fireEvent.click(screen.getByRole('button', { name: /Save/i }));
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/Tile changed/i));

  fireEvent.click(screen.getByRole('button', { name: /Discard draft and reload/i }));
  await waitFor(() => expect(onConflictReload).toHaveBeenCalledTimes(1));

  expect(props.handleClose).not.toHaveBeenCalled();
  expect(screen.getByLabelText(/Current Points/i)).toHaveValue('20');
  expect(screen.getByRole('button', { name: /Discard draft and reload/i })).toBeEnabled();
});

test('retains draft revisions and team identity across refreshed props from SSE', async () => {
  const props = renderTileModal({
    boardSettingsRevision: 4,
    info: { ...baseInfo, revision: 7 },
    teamId: 0,
    teamInfo: { ...baseTeamInfo, revision: 3 },
  });
  const currentPoints = screen.getByLabelText(/Current Points/i);
  fireEvent.change(currentPoints, { target: { value: '20' } });

  props.rerender({
    boardSettingsRevision: 9,
    info: { ...baseInfo, revision: 8 },
    teamId: 1,
    teamInfo: { ...baseTeamInfo, currPoints: 30, revision: 4 },
  });

  fireEvent.click(screen.getByRole('button', { name: /Save/i }));
  await waitFor(() => expect(props.change).toHaveBeenCalled());
  expect(props.change).toHaveBeenCalledWith(
    1,
    2,
    expect.anything(),
    expect.objectContaining({
      expectedBoardTileRevision: 7,
      expectedRevision: 3,
      expectedSettingsRevision: 4,
      teamId: 0,
    })
  );
});

test('disables duplicate tile saves while the parent request is pending', async () => {
  let resolveSave!: (saved: boolean) => void;
  const change = vi.fn(
    () =>
      new Promise<boolean>((resolve) => {
        resolveSave = resolve;
      })
  );
  const props = renderTileModal({ change });
  const saveButton = screen.getByRole('button', { name: /Save/i });

  fireEvent.click(saveButton);
  fireEvent.click(saveButton);

  expect(change).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('button', { name: /Saving/i })).toBeDisabled();
  expect(props.handleClose).not.toHaveBeenCalled();

  resolveSave(true);
  await waitFor(() => expect(props.handleClose).toHaveBeenCalledTimes(1));
});

test('does not include edits made while a tile save is pending', async () => {
  let resolveSave!: (saved: boolean) => void;
  const change = vi.fn(
    () =>
      new Promise<boolean>((resolve) => {
        resolveSave = resolve;
      })
  );
  const props = renderTileModal({ change });
  const currentPoints = screen.getByLabelText(/Current Points/i);

  fireEvent.click(screen.getByRole('button', { name: /Save/i }));
  fireEvent.change(currentPoints, { target: { value: '20' } });

  expect(currentPoints).toBeDisabled();
  expect(currentPoints).toHaveValue('10');

  resolveSave(true);
  await waitFor(() => expect(props.handleClose).toHaveBeenCalledTimes(1));
});

test('waits for delayed proof uploads before saving the draft', async () => {
  const readers: Array<{
    onload: ((event: ProgressEvent<FileReader>) => void) | null;
    onerror: ((event: ProgressEvent<FileReader>) => void) | null;
    onabort: ((event: ProgressEvent<FileReader>) => void) | null;
  }> = [];
  vi.stubGlobal(
    'FileReader',
    class {
      onload: ((event: ProgressEvent<FileReader>) => void) | null = null;
      onerror: ((event: ProgressEvent<FileReader>) => void) | null = null;
      onabort: ((event: ProgressEvent<FileReader>) => void) | null = null;

      readAsDataURL() {
        readers.push(this);
      }
    }
  );

  const change = vi.fn().mockResolvedValue(false);
  const props = renderTileModal({ change });
  const fileInput = document.querySelector<HTMLInputElement>('.proof-upload-input');
  const saveButton = screen.getByRole('button', { name: /^Save$/i });
  const file = new File(['proof'], 'proof.png', { type: 'image/png' });

  expect(fileInput).not.toBeNull();
  fireEvent.change(fileInput!, { target: { files: [file] } });
  expect(screen.getByRole('button', { name: /Reading/i })).toBeDisabled();

  fireEvent.click(saveButton);
  expect(change).not.toHaveBeenCalled();

  await act(async () => {
    readers[0]?.onload?.({
      target: { result: 'data:image/png;base64,proof' },
    } as ProgressEvent<FileReader>);
  });
  await waitFor(() => expect(screen.getByRole('button', { name: /^Save$/i })).toBeEnabled());

  fireEvent.click(screen.getByRole('button', { name: /^Save$/i }));
  await waitFor(() => expect(change).toHaveBeenCalled());
  expect(change).toHaveBeenCalledWith(
    1,
    2,
    expect.objectContaining({
      proofImages: ['data:image/png;base64,proof'],
    }),
    expect.objectContaining({
      expectedBoardTileRevision: 0,
      expectedRevision: 0,
      expectedSettingsRevision: 0,
      teamId: undefined,
    })
  );
  expect(props.handleClose).not.toHaveBeenCalled();

  vi.unstubAllGlobals();
});

test('completes a tile without configured points as a zero-point tile', async () => {
  const props = renderTileModal({
    info: { ...baseInfo, points: '' },
    teamInfo: { ...baseTeamInfo, currPoints: 0 },
  });

  fireEvent.click(screen.getByLabelText(/Completed\?/i));
  fireEvent.click(screen.getByRole('button', { name: /Save/i }));

  await waitFor(() => expect(props.change).toHaveBeenCalled());
  expect(props.change).toHaveBeenCalledWith(
    1,
    2,
    expect.objectContaining({
      checked: true,
      currPoints: 0,
    }),
    expect.objectContaining({
      expectedBoardTileRevision: 0,
      expectedRevision: 0,
      expectedSettingsRevision: 0,
      teamId: undefined,
    })
  );
});

test('general users can edit current points but not total points', () => {
  renderTileModal();

  expect(screen.getByLabelText(/Current Points/i)).toBeEnabled();
  expect(screen.getByLabelText(/Total Points/i)).toBeDisabled();
});

test('admins can edit total points but not current points', () => {
  renderTileModal({ privilege: 'admin', teamInfo: {} });

  expect(screen.getByLabelText(/Current Points/i)).toBeDisabled();
  expect(screen.getByLabelText(/Total Points/i)).toBeEnabled();
});

test('admins save legacy tile images without opacity', async () => {
  const props = renderTileModal({
    privilege: 'admin',
    teamInfo: {},
    info: {
      ...baseInfo,
      image: {
        opacity: 45,
        url: 'https://example.com/legacy-tile.png',
        usePixel: false,
      },
    },
  });

  expect(screen.getByRole('img', { name: /Tile background/i }).getAttribute('style')).toContain(
    'opacity: 45%'
  );
  expect(screen.queryByLabelText(/Image Opacity/i)).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /Save/i }));

  await waitFor(() => expect(props.change).toHaveBeenCalled());

  const savedState = props.change.mock.calls[0][2];
  expect(savedState.image).toEqual(
    expect.objectContaining({
      url: 'https://example.com/legacy-tile.png',
      usePixel: false,
    })
  );
  expect(savedState.image).not.toHaveProperty('opacity');
});

test('shows bundled tile images but saves the selected object as a wiki detail image', async () => {
  const props = renderTileModal({ privilege: 'admin', teamInfo: {} });

  fireEvent.click(screen.getByRole('button', { name: /Set Tile Background Image/i }));
  expect(screen.getByRole('heading', { name: /Set Tile Background Image/i })).toBeInTheDocument();

  const tileImages = screen.getAllByRole('img').filter((img) => img.getAttribute('title'));
  expect(tileImages.length).toBeGreaterThan(0);

  const selectedTitle = tileImages[0]?.getAttribute('title') || '';
  const wikiName = encodeURIComponent(selectedTitle.replaceAll(' ', '_'));
  const expectedWikiUrl = `https://oldschool.runescape.wiki/images/thumb/${wikiName}_detail.png/180px-${wikiName}_detail.png`;

  fireEvent.click(tileImages[0]);

  await waitFor(() => {
    expect(
      screen.getByRole('button', { name: /Remove Tile Background Image/i })
    ).toBeInTheDocument();
  });

  await waitFor(() => {
    expect(
      screen.getByRole('button', { name: /Remove Tile Background Image/i })
    ).toBeInTheDocument();
  });
  expect(screen.getByRole('img')).toHaveAttribute('src', expectedWikiUrl);
  expect(screen.queryByLabelText(/Image Opacity/i)).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /Save/i }));

  await waitFor(() => expect(props.change).toHaveBeenCalled());

  const savedState = props.change.mock.calls[0][2];
  expect(savedState.image).toEqual(
    expect.objectContaining({
      usePixel: false,
      url: expectedWikiUrl,
    })
  );
  expect(savedState.image).not.toHaveProperty('opacity');
});

test('closes modal when escape key is pressed', () => {
  const props = renderTileModal();

  fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });

  expect(props.handleClose).toHaveBeenCalled();
});

test('clears loading and shows an error when wiki search fails', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.reject(new Error('network error')))
  );

  renderTileModal({ privilege: 'admin', teamInfo: {} });

  fireEvent.click(screen.getByRole('button', { name: /Set Tile Background Image/i }));

  const searchInput = screen.getByLabelText(/Item Search/i);
  fireEvent.change(searchInput, { target: { value: 'Coins' } });

  await waitFor(() => {
    expect(screen.getByRole('alert')).toHaveTextContent(/Could not reach the OSRS wiki/i);
  });
  expect(screen.queryByRole('status')).not.toBeInTheDocument();

  vi.unstubAllGlobals();
});

test('osrs searches include gif file results in the same suggestion list', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/rest.php/v1/search/title')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              pages: [
                {
                  thumbnail: { url: 'https://oldschool.runescape.wiki/images/Crab.png' },
                  title: 'Crab',
                },
              ],
            }),
        });
      }
      if (url.includes('/images/thumb/Crab_detail.png')) {
        return Promise.reject(new Error('detail image should not be probed directly'));
      }
      if (url.includes('list=search')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              query: {
                search: [{ title: 'File:Crab dance.gif' }],
              },
            }),
        });
      }
      if (url.includes('prop=imageinfo')) {
        const decodedUrl = decodeURIComponent(url);
        if (decodedUrl.includes('Crab_detail.png')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                query: {
                  pages: {
                    12345: {
                      title: 'File:Crab detail.png',
                      imageinfo: [
                        {
                          descriptionurl: 'https://oldschool.runescape.wiki/w/File:Crab_detail.png',
                          mime: 'image/png',
                          thumburl:
                            'https://oldschool.runescape.wiki/images/thumb/Crab_detail.png/180px-Crab_detail.png',
                          url: 'https://oldschool.runescape.wiki/images/Crab_detail.png',
                        },
                      ],
                    },
                  },
                },
              }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              query: {
                pages: {
                  626372: {
                    title: 'File:Crab dance.gif',
                    imageinfo: [
                      {
                        descriptionurl: 'https://oldschool.runescape.wiki/w/File:Crab_dance.gif',
                        mime: 'image/gif',
                        thumburl: 'https://oldschool.runescape.wiki/images/thumb/Crab_dance.gif',
                        url: 'https://oldschool.runescape.wiki/images/Crab_dance.gif',
                      },
                    ],
                  },
                },
              },
            }),
        });
      }
      return Promise.reject(new Error(`unexpected fetch ${url}`));
    })
  );

  const props = renderTileModal({ privilege: 'admin', teamInfo: {} });

  fireEvent.click(screen.getByRole('button', { name: /Set Tile Background Image/i }));
  fireEvent.change(screen.getByLabelText(/Item Search/i), { target: { value: 'crab dance' } });

  await waitFor(
    () => {
      expect(screen.getByText('Crab')).toBeInTheDocument();
      expect(screen.getByText('Crab dance')).toBeInTheDocument();
    },
    { timeout: 2000 }
  );

  expect(screen.getByText(/OSRS Wiki GIF/i)).toBeInTheDocument();
  expect(
    (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.some(([input]) =>
      decodeURIComponent(String(input)).includes('srsearch=Crab+dance+gif')
    )
  ).toBe(true);
  expect(
    (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.some(([input]) =>
      String(input).includes('/images/thumb/Crab_detail.png')
    )
  ).toBe(false);

  fireEvent.click(screen.getByText('Crab dance'));

  await waitFor(() => {
    expect(
      screen.getByRole('button', { name: /Remove Tile Background Image/i })
    ).toBeInTheDocument();
  });
  expect(screen.getByRole('img', { name: /Tile background/i })).toHaveAttribute(
    'src',
    'https://oldschool.runescape.wiki/images/Crab_dance.gif'
  );
  expect(screen.queryByLabelText(/Use pixel image/i)).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /Save/i }));

  await waitFor(() => expect(props.change).toHaveBeenCalled());

  const savedState = props.change.mock.calls[0][2];
  expect(savedState.image).toEqual(
    expect.objectContaining({
      animated: true,
      sourceName: 'OSRS Wiki GIF',
      sourceUrl: 'https://oldschool.runescape.wiki/w/File:Crab_dance.gif',
      url: 'https://oldschool.runescape.wiki/images/Crab_dance.gif',
    })
  );
  expect(savedState.image).not.toHaveProperty('opacity');

  vi.unstubAllGlobals();
});

test('generic boards search Commons and save source metadata', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            query: {
              pages: {
                1: {
                  title: 'File:Birthday cake.jpg',
                  imageinfo: [
                    {
                      descriptionurl: 'https://commons.wikimedia.org/wiki/File:Birthday_cake.jpg',
                      extmetadata: {
                        Artist: { value: '<a href="/wiki/User:Baker">Baker</a>' },
                        LicenseShortName: { value: 'CC BY-SA 4.0' },
                        LicenseUrl: { value: 'https://creativecommons.org/licenses/by-sa/4.0/' },
                        ObjectName: { value: 'Birthday cake' },
                      },
                      thumburl: 'https://upload.wikimedia.org/thumb/cake.jpg/180px-cake.jpg',
                      url: 'https://upload.wikimedia.org/cake.jpg',
                    },
                  ],
                },
              },
            },
          }),
      })
    )
  );

  const props = renderTileModal({ boardType: 'generic', privilege: 'admin', teamInfo: {} });

  fireEvent.click(screen.getByRole('button', { name: /Set Tile Background Image/i }));

  expect(screen.queryAllByRole('img').filter((img) => img.getAttribute('title')).length).toBe(0);
  expect(screen.getByText(/Wikimedia Commons/i)).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText(/Image Search/i), { target: { value: 'Birthday cake' } });

  await waitFor(
    () => {
      expect(screen.getByText('Birthday cake')).toBeInTheDocument();
    },
    { timeout: 2000 }
  );

  fireEvent.click(screen.getByText('Birthday cake'));

  await waitFor(() => {
    expect(
      screen.getByRole('button', { name: /Remove Tile Background Image/i })
    ).toBeInTheDocument();
  });

  expect(screen.queryByLabelText(/Use pixel image/i)).not.toBeInTheDocument();
  expect(screen.getByText(/Source:/i)).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /Save/i }));

  await waitFor(() => expect(props.change).toHaveBeenCalled());

  const savedState = props.change.mock.calls[0][2];
  expect(savedState.image).toEqual(
    expect.objectContaining({
      attribution: 'Baker',
      license: 'CC BY-SA 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
      sourceName: 'Wikimedia Commons',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Birthday_cake.jpg',
      url: 'https://upload.wikimedia.org/thumb/cake.jpg/180px-cake.jpg',
    })
  );
  expect(savedState.image).not.toHaveProperty('opacity');

  vi.unstubAllGlobals();
});

test('does not close modal on escape if lightbox is open', () => {
  const props = renderTileModal({
    teamInfo: {
      checked: false,
      currPoints: 10,
      proof: '',
      proofImages: ['data:image/png;base64,iVBORw0KGgo='],
    },
  });

  const img = screen.getByRole('img', { name: /proof/i });
  fireEvent.click(img);

  expect(screen.getByText('1 / 1')).toBeInTheDocument();

  fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });

  expect(screen.queryByText('1 / 1')).not.toBeInTheDocument();
  expect(props.handleClose).not.toHaveBeenCalled();
});
