import http from 'node:http';

/**
 * Starts a server on loopback and returns it once it is listening. Pass it to supertest.
 *
 * Handing supertest a bare Express app makes it open a new server on a random port for every
 * request. With many test processes running at once (CI, or several local runs) a request can
 * reach another process's server on a recycled port, giving "socket hang up" or a 404 from the
 * wrong app. One long-lived server per test, bound to 127.0.0.1, avoids that churn.
 */
export async function listen(app: http.RequestListener): Promise<http.Server> {
  const server = http.createServer(app);
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve());
  });
  return server;
}

export function close(server: http.Server): Promise<void> {
  return new Promise((resolve) => {
    server.close(() => resolve());
    server.closeAllConnections();
  });
}
