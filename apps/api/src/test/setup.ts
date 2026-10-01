import http from 'node:http';

// Since Node 19 HTTP keep-alive is on by default, so a test client can reuse a pooled socket whose
// server has already closed ("socket hang up"). Close the connection after every request.
// This is a precaution; the larger fix for flaky runs is one long-lived server per test
// (see ./server.ts), which stops requests from reaching another test process's server.
http.globalAgent = new http.Agent({ keepAlive: false });
