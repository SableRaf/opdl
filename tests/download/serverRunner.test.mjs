import { describe, it, expect, vi } from 'vitest';
import path from 'path';
import { openBrowser, runViteServer, runSimpleHttpServer } from '../../src/download/serverRunner.js';

describe('openBrowser', () => {
  it('does nothing when URL cannot be parsed', () => {
    const spawnFn = vi.fn(() => ({ on: vi.fn() }));
    openBrowser('not-a-url', { spawnFn });
    expect(spawnFn).not.toHaveBeenCalled();
  });

  const browserUrl = 'https://openprocessing.org/';
  const scenarios = [
    { platform: 'darwin', command: 'open', args: [browserUrl] },
    {
      platform: 'win32',
      command: 'cmd',
      args: ['/c', 'start', '', browserUrl],
    },
    { platform: 'linux', command: 'xdg-open', args: [browserUrl] },
  ];

  for (const { platform, command, args } of scenarios) {
    it(`invokes spawn with correct command on ${platform}`, () => {
      const onMock = vi.fn();
      const spawnFn = vi.fn(() => ({ on: onMock }));
      openBrowser(browserUrl, { spawnFn, platform });
      expect(spawnFn).toHaveBeenCalledWith(command, args, {
        stdio: 'ignore',
        detached: true,
      });
      expect(onMock).toHaveBeenCalledWith('error', expect.any(Function));
    });
  }
});

describe('runViteServer', () => {
  it('rejects when package.json does not exist', async () => {
    const fsModule = { existsSync: vi.fn(() => false) };
    await expect(runViteServer('/project', true, { fsModule })).rejects.toThrow(
      'package.json not found. Cannot run Vite server.'
    );
  });

  it('runs npm dev script when package.json exists (posix)', async () => {
    const fsModule = { existsSync: vi.fn(() => true) };
    const onMock = vi.fn();
    const spawnFn = vi.fn(() => ({ on: onMock }));
    await runViteServer('/project', true, { fsModule, spawnFn, platform: 'linux' });
    expect(spawnFn).toHaveBeenCalledWith('npm', ['run', 'dev'], {
      cwd: '/project',
      stdio: 'inherit',
    });
    expect(onMock).toHaveBeenCalledWith('error', expect.any(Function));
  });

  it('uses npm.cmd when running on Windows', async () => {
    const fsModule = { existsSync: vi.fn(() => true) };
    const spawnFn = vi.fn(() => ({ on: vi.fn() }));
    await runViteServer('C:\\project', true, { fsModule, spawnFn, platform: 'win32' });
    expect(spawnFn).toHaveBeenCalledWith('npm.cmd', ['run', 'dev'], {
      cwd: 'C:\\project',
      stdio: 'inherit',
    });
  });
});

describe('runSimpleHttpServer', () => {
  it('serves files in the output directory and opens the browser', async () => {
    let requestHandler;
    const server = {
      listen: vi.fn((_, cb) => cb()),
      on: vi.fn(),
    };
    const httpModule = {
      createServer: vi.fn((handler) => {
        requestHandler = handler;
        return server;
      }),
    };
    const fileContent = Buffer.from('<html></html>');
    const fsModule = {
      stat: vi.fn((_, cb) =>
        cb(null, {
          isFile: () => true,
        })
      ),
      readFile: vi.fn((_, cb) => cb(null, fileContent)),
    };
    const res = { writeHead: vi.fn(), end: vi.fn() };
    const openBrowserFn = vi.fn();
    const setTimeoutFn = vi.fn((fn) => fn());
    const outputDir = path.join(process.cwd(), 'test-output');

    await runSimpleHttpServer(outputDir, true, {
      httpModule,
      fsModule,
      pathModule: path,
      openBrowserFn,
      setTimeoutFn,
      resolveOnStart: true,
    });

    requestHandler({ url: '/index.html' }, res);

    expect(fsModule.stat).toHaveBeenCalledWith(
      path.join(outputDir, 'index.html'),
      expect.any(Function)
    );
    expect(res.writeHead).toHaveBeenCalledWith(200, { 'Content-Type': 'text/html' });
    expect(res.end).toHaveBeenCalledWith(fileContent);
    expect(openBrowserFn).toHaveBeenCalledWith('http://localhost:3000/');
  });

  it('rejects requests outside of the output directory', async () => {
    let requestHandler;
    const server = {
      listen: vi.fn((_, cb) => cb()),
      on: vi.fn(),
    };
    const httpModule = {
      createServer: vi.fn((handler) => {
        requestHandler = handler;
        return server;
      }),
    };
    const fsModule = {
      stat: vi.fn(),
      readFile: vi.fn(),
    };
    const res = { writeHead: vi.fn(), end: vi.fn() };
    const openBrowserFn = vi.fn();
    const setTimeoutFn = vi.fn((fn) => fn());
    const outputDir = path.join(process.cwd(), 'serve-root');

    await runSimpleHttpServer(outputDir, true, {
      httpModule,
      fsModule,
      pathModule: path,
      openBrowserFn,
      setTimeoutFn,
      resolveOnStart: true,
    });

    requestHandler({ url: '/../secret.txt' }, res);

    expect(res.writeHead).toHaveBeenCalledWith(403, { 'Content-Type': 'text/plain' });
    expect(res.end).toHaveBeenCalledWith('403 Forbidden');
    expect(fsModule.stat).not.toHaveBeenCalled();
  });

  it('rejects when the port is already in use', async () => {
    let errorHandler;
    const server = {
      listen: vi.fn(),
      on: vi.fn((event, handler) => {
        if (event === 'error') {
          errorHandler = handler;
        }
      }),
    };
    const httpModule = {
      createServer: vi.fn(() => server),
    };
    const openBrowserFn = vi.fn();
    const setTimeoutFn = vi.fn();

    const serverPromise = runSimpleHttpServer('/project', true, {
      httpModule,
      openBrowserFn,
      setTimeoutFn,
    });

    const error = Object.assign(new Error('busy'), { code: 'EADDRINUSE' });
    errorHandler(error);

    await expect(serverPromise).rejects.toThrow('busy');
  });
});
