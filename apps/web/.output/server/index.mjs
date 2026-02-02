globalThis.__nitro_main__ = import.meta.url;
import nodeHTTP from "node:http";
import { Readable } from "node:stream";
import nodeHTTPS from "node:https";
import nodeHTTP2 from "node:http2";
import { promises } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
function lazyService(loader) {
  let promise, mod;
  return {
    fetch(req) {
      if (mod) {
        return mod.fetch(req);
      }
      if (!promise) {
        promise = loader().then((_mod) => mod = _mod.default || _mod);
      }
      return promise.then((mod2) => mod2.fetch(req));
    }
  };
}
const services = {
  ["ssr"]: lazyService(() => import("./chunks/_/server.mjs"))
};
globalThis.__nitro_vite_envs__ = services;
function lazyInherit(target, source, sourceKey) {
  for (const key2 of [...Object.getOwnPropertyNames(source), ...Object.getOwnPropertySymbols(source)]) {
    if (key2 === "constructor") continue;
    const targetDesc = Object.getOwnPropertyDescriptor(target, key2);
    const desc = Object.getOwnPropertyDescriptor(source, key2);
    let modified = false;
    if (desc.get) {
      modified = true;
      desc.get = targetDesc?.get || function() {
        return this[sourceKey][key2];
      };
    }
    if (desc.set) {
      modified = true;
      desc.set = targetDesc?.set || function(value) {
        this[sourceKey][key2] = value;
      };
    }
    if (!targetDesc?.value && typeof desc.value === "function") {
      modified = true;
      desc.value = function(...args) {
        return this[sourceKey][key2](...args);
      };
    }
    if (modified) Object.defineProperty(target, key2, desc);
  }
}
const FastURL = /* @__PURE__ */ (() => {
  const NativeURL = globalThis.URL;
  const FastURL$1 = class URL {
    #url;
    #href;
    #protocol;
    #host;
    #pathname;
    #search;
    #searchParams;
    #pos;
    constructor(url) {
      if (typeof url === "string") this.#href = url;
      else {
        this.#protocol = url.protocol;
        this.#host = url.host;
        this.#pathname = url.pathname;
        this.#search = url.search;
      }
    }
    static [Symbol.hasInstance](val) {
      return val instanceof NativeURL;
    }
    get _url() {
      if (this.#url) return this.#url;
      this.#url = new NativeURL(this.href);
      this.#href = void 0;
      this.#protocol = void 0;
      this.#host = void 0;
      this.#pathname = void 0;
      this.#search = void 0;
      this.#searchParams = void 0;
      this.#pos = void 0;
      return this.#url;
    }
    get href() {
      if (this.#url) return this.#url.href;
      if (!this.#href) this.#href = `${this.#protocol || "http:"}//${this.#host || "localhost"}${this.#pathname || "/"}${this.#search || ""}`;
      return this.#href;
    }
    #getPos() {
      if (!this.#pos) {
        const url = this.href;
        const protoIndex = url.indexOf("://");
        const pathnameIndex = protoIndex === -1 ? -1 : url.indexOf("/", protoIndex + 4);
        this.#pos = [
          protoIndex,
          pathnameIndex,
          pathnameIndex === -1 ? -1 : url.indexOf("?", pathnameIndex)
        ];
      }
      return this.#pos;
    }
    get pathname() {
      if (this.#url) return this.#url.pathname;
      if (this.#pathname === void 0) {
        const [, pathnameIndex, queryIndex] = this.#getPos();
        if (pathnameIndex === -1) return this._url.pathname;
        this.#pathname = this.href.slice(pathnameIndex, queryIndex === -1 ? void 0 : queryIndex);
      }
      return this.#pathname;
    }
    get search() {
      if (this.#url) return this.#url.search;
      if (this.#search === void 0) {
        const [, pathnameIndex, queryIndex] = this.#getPos();
        if (pathnameIndex === -1) return this._url.search;
        const url = this.href;
        this.#search = queryIndex === -1 || queryIndex === url.length - 1 ? "" : url.slice(queryIndex);
      }
      return this.#search;
    }
    get searchParams() {
      if (this.#url) return this.#url.searchParams;
      if (!this.#searchParams) this.#searchParams = new URLSearchParams(this.search);
      return this.#searchParams;
    }
    get protocol() {
      if (this.#url) return this.#url.protocol;
      if (this.#protocol === void 0) {
        const [protocolIndex] = this.#getPos();
        if (protocolIndex === -1) return this._url.protocol;
        this.#protocol = this.href.slice(0, protocolIndex + 1);
      }
      return this.#protocol;
    }
    toString() {
      return this.href;
    }
    toJSON() {
      return this.href;
    }
  };
  lazyInherit(FastURL$1.prototype, NativeURL.prototype, "_url");
  Object.setPrototypeOf(FastURL$1.prototype, NativeURL.prototype);
  Object.setPrototypeOf(FastURL$1, NativeURL);
  return FastURL$1;
})();
function resolvePortAndHost(opts) {
  const _port = opts.port ?? globalThis.process?.env.PORT ?? 3e3;
  const port2 = typeof _port === "number" ? _port : Number.parseInt(_port, 10);
  if (port2 < 0 || port2 > 65535) throw new RangeError(`Port must be between 0 and 65535 (got "${port2}").`);
  return {
    port: port2,
    hostname: opts.hostname ?? globalThis.process?.env.HOST
  };
}
function fmtURL(host2, port2, secure) {
  if (!host2 || !port2) return;
  if (host2.includes(":")) host2 = `[${host2}]`;
  return `http${secure ? "s" : ""}://${host2}:${port2}/`;
}
function printListening(opts, url) {
  if (!url || (opts.silent ?? globalThis.process?.env?.TEST)) return;
  const _url = new URL(url);
  const allInterfaces = _url.hostname === "[::]" || _url.hostname === "0.0.0.0";
  if (allInterfaces) {
    _url.hostname = "localhost";
    url = _url.href;
  }
  let listeningOn = `➜ Listening on:`;
  let additionalInfo = allInterfaces ? " (all interfaces)" : "";
  if (globalThis.process.stdout?.isTTY) {
    listeningOn = `\x1B[32m${listeningOn}\x1B[0m`;
    url = `\x1B[36m${url}\x1B[0m`;
    additionalInfo = `\x1B[2m${additionalInfo}\x1B[0m`;
  }
  console.log(`${listeningOn} ${url}${additionalInfo}`);
}
function resolveTLSOptions(opts) {
  if (!opts.tls || opts.protocol === "http") return;
  const cert2 = resolveCertOrKey(opts.tls.cert);
  const key2 = resolveCertOrKey(opts.tls.key);
  if (!cert2 && !key2) {
    if (opts.protocol === "https") throw new TypeError("TLS `cert` and `key` must be provided for `https` protocol.");
    return;
  }
  if (!cert2 || !key2) throw new TypeError("TLS `cert` and `key` must be provided together.");
  return {
    cert: cert2,
    key: key2,
    passphrase: opts.tls.passphrase
  };
}
function resolveCertOrKey(value) {
  if (!value) return;
  if (typeof value !== "string") throw new TypeError("TLS certificate and key must be strings in PEM format or file paths.");
  if (value.startsWith("-----BEGIN ")) return value;
  const { readFileSync } = process.getBuiltinModule("node:fs");
  return readFileSync(value, "utf8");
}
function createWaitUntil() {
  const promises2 = /* @__PURE__ */ new Set();
  return {
    waitUntil: (promise) => {
      if (typeof promise?.then !== "function") return;
      promises2.add(Promise.resolve(promise).catch(console.error).finally(() => {
        promises2.delete(promise);
      }));
    },
    wait: () => {
      return Promise.all(promises2);
    }
  };
}
const noColor = /* @__PURE__ */ (() => {
  const env = globalThis.process?.env ?? {};
  return env.NO_COLOR === "1" || env.TERM === "dumb";
})();
const _c = (c, r = 39) => (t) => noColor ? t : `\x1B[${c}m${t}\x1B[${r}m`;
const red = /* @__PURE__ */ _c(31);
const gray = /* @__PURE__ */ _c(90);
function wrapFetch(server) {
  const fetchHandler = server.options.fetch;
  const middleware = server.options.middleware || [];
  return middleware.length === 0 ? fetchHandler : (request) => callMiddleware$1(request, fetchHandler, middleware, 0);
}
function callMiddleware$1(request, fetchHandler, middleware, index) {
  if (index === middleware.length) return fetchHandler(request);
  return middleware[index](request, () => callMiddleware$1(request, fetchHandler, middleware, index + 1));
}
const errorPlugin = (server) => {
  const errorHandler2 = server.options.error;
  if (!errorHandler2) return;
  server.options.middleware.unshift((_req, next) => {
    try {
      const res = next();
      return res instanceof Promise ? res.catch((error) => errorHandler2(error)) : res;
    } catch (error) {
      return errorHandler2(error);
    }
  });
};
const gracefulShutdownPlugin = (server) => {
  const config = server.options?.gracefulShutdown;
  if (!globalThis.process?.on || config === false || config === void 0 && (process.env.CI || process.env.TEST)) return;
  const gracefulShutdown = config === true || !config?.gracefulTimeout ? Number.parseInt(process.env.SERVER_SHUTDOWN_TIMEOUT || "") || 3 : config.gracefulTimeout;
  const forceShutdown = config === true || !config?.forceTimeout ? Number.parseInt(process.env.SERVER_FORCE_SHUTDOWN_TIMEOUT || "") || 5 : config.forceTimeout;
  let isShuttingDown = false;
  const shutdown = async () => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    const w = process.stderr.write.bind(process.stderr);
    w(gray(`
Shutting down server in ${gracefulShutdown}s...`));
    let timeout;
    await Promise.race([server.close().finally(() => {
      clearTimeout(timeout);
      w(gray(" Server closed.\n"));
    }), new Promise((resolve2) => {
      timeout = setTimeout(() => {
        w(gray(`
Force closing connections in ${forceShutdown}s...`));
        timeout = setTimeout(() => {
          w(red("\nCould not close connections in time, force exiting."));
          resolve2();
        }, forceShutdown * 1e3);
        return server.close(true);
      }, gracefulShutdown * 1e3);
    })]);
    globalThis.process.exit(0);
  };
  for (const sig of ["SIGINT", "SIGTERM"]) globalThis.process.on(sig, shutdown);
};
const NodeResponse = /* @__PURE__ */ (() => {
  const NativeResponse = globalThis.Response;
  const STATUS_CODES = globalThis.process?.getBuiltinModule?.("node:http")?.STATUS_CODES || {};
  class NodeResponse$1 {
    #body;
    #init;
    #headers;
    #response;
    constructor(body, init) {
      this.#body = body;
      this.#init = init;
    }
    static [Symbol.hasInstance](val) {
      return val instanceof NativeResponse;
    }
    get status() {
      return this.#response?.status || this.#init?.status || 200;
    }
    get statusText() {
      return this.#response?.statusText || this.#init?.statusText || STATUS_CODES[this.status] || "";
    }
    get headers() {
      if (this.#response) return this.#response.headers;
      if (this.#headers) return this.#headers;
      const initHeaders = this.#init?.headers;
      return this.#headers = initHeaders instanceof Headers ? initHeaders : new Headers(initHeaders);
    }
    get ok() {
      if (this.#response) return this.#response.ok;
      const status = this.status;
      return status >= 200 && status < 300;
    }
    get _response() {
      if (this.#response) return this.#response;
      this.#response = new NativeResponse(this.#body, this.#headers ? {
        ...this.#init,
        headers: this.#headers
      } : this.#init);
      this.#init = void 0;
      this.#headers = void 0;
      this.#body = void 0;
      return this.#response;
    }
    _toNodeResponse() {
      const status = this.status;
      const statusText = this.statusText;
      let body;
      let contentType;
      let contentLength;
      if (this.#response) body = this.#response.body;
      else if (this.#body) if (this.#body instanceof ReadableStream) body = this.#body;
      else if (typeof this.#body === "string") {
        body = this.#body;
        contentType = "text/plain; charset=UTF-8";
        contentLength = Buffer.byteLength(this.#body);
      } else if (this.#body instanceof ArrayBuffer) {
        body = Buffer.from(this.#body);
        contentLength = this.#body.byteLength;
      } else if (this.#body instanceof Uint8Array) {
        body = this.#body;
        contentLength = this.#body.byteLength;
      } else if (this.#body instanceof DataView) {
        body = Buffer.from(this.#body.buffer);
        contentLength = this.#body.byteLength;
      } else if (this.#body instanceof Blob) {
        body = this.#body.stream();
        contentType = this.#body.type;
        contentLength = this.#body.size;
      } else if (typeof this.#body.pipe === "function") body = this.#body;
      else body = this._response.body;
      const headers2 = [];
      const initHeaders = this.#init?.headers;
      const headerEntries = this.#response?.headers || this.#headers || (initHeaders ? Array.isArray(initHeaders) ? initHeaders : initHeaders?.entries ? initHeaders.entries() : Object.entries(initHeaders).map(([k, v]) => [k.toLowerCase(), v]) : void 0);
      let hasContentTypeHeader;
      let hasContentLength;
      if (headerEntries) for (const [key2, value] of headerEntries) {
        if (Array.isArray(value)) for (const v of value) headers2.push([key2, v]);
        else headers2.push([key2, value]);
        if (key2 === "content-type") hasContentTypeHeader = true;
        else if (key2 === "content-length") hasContentLength = true;
      }
      if (contentType && !hasContentTypeHeader) headers2.push(["content-type", contentType]);
      if (contentLength && !hasContentLength) headers2.push(["content-length", String(contentLength)]);
      this.#init = void 0;
      this.#headers = void 0;
      this.#response = void 0;
      this.#body = void 0;
      return {
        status,
        statusText,
        headers: headers2,
        body
      };
    }
  }
  lazyInherit(NodeResponse$1.prototype, NativeResponse.prototype, "_response");
  Object.setPrototypeOf(NodeResponse$1, NativeResponse);
  Object.setPrototypeOf(NodeResponse$1.prototype, NativeResponse.prototype);
  return NodeResponse$1;
})();
async function sendNodeResponse(nodeRes, webRes) {
  if (!webRes) {
    nodeRes.statusCode = 500;
    return endNodeResponse(nodeRes);
  }
  if (webRes._toNodeResponse) {
    const res = webRes._toNodeResponse();
    writeHead(nodeRes, res.status, res.statusText, res.headers);
    if (res.body) {
      if (res.body instanceof ReadableStream) return streamBody(res.body, nodeRes);
      else if (typeof res.body?.pipe === "function") {
        res.body.pipe(nodeRes);
        return new Promise((resolve2) => nodeRes.on("close", resolve2));
      }
      nodeRes.write(res.body);
    }
    return endNodeResponse(nodeRes);
  }
  const rawHeaders = [...webRes.headers];
  writeHead(nodeRes, webRes.status, webRes.statusText, rawHeaders);
  return webRes.body ? streamBody(webRes.body, nodeRes) : endNodeResponse(nodeRes);
}
function writeHead(nodeRes, status, statusText, rawHeaders) {
  const writeHeaders = globalThis.Deno ? rawHeaders : rawHeaders.flat();
  if (!nodeRes.headersSent) if (nodeRes.req?.httpVersion === "2.0") nodeRes.writeHead(status, writeHeaders);
  else nodeRes.writeHead(status, statusText, writeHeaders);
}
function endNodeResponse(nodeRes) {
  return new Promise((resolve2) => nodeRes.end(resolve2));
}
function streamBody(stream, nodeRes) {
  if (nodeRes.destroyed) {
    stream.cancel();
    return;
  }
  const reader = stream.getReader();
  function streamCancel(error) {
    reader.cancel(error).catch(() => {
    });
    if (error) nodeRes.destroy(error);
  }
  function streamHandle({ done, value }) {
    try {
      if (done) nodeRes.end();
      else if (nodeRes.write(value)) reader.read().then(streamHandle, streamCancel);
      else nodeRes.once("drain", () => reader.read().then(streamHandle, streamCancel));
    } catch (error) {
      streamCancel(error instanceof Error ? error : void 0);
    }
  }
  nodeRes.on("close", streamCancel);
  nodeRes.on("error", streamCancel);
  reader.read().then(streamHandle, streamCancel);
  return reader.closed.catch(streamCancel).finally(() => {
    nodeRes.off("close", streamCancel);
    nodeRes.off("error", streamCancel);
  });
}
var NodeRequestURL = class extends FastURL {
  #req;
  constructor({ req }) {
    const path = req.url || "/";
    if (path[0] === "/") {
      const qIndex = path.indexOf("?");
      const pathname = qIndex === -1 ? path : path?.slice(0, qIndex) || "/";
      const search = qIndex === -1 ? "" : path?.slice(qIndex) || "";
      const host2 = req.headers.host || req.headers[":authority"] || `${req.socket.localFamily === "IPv6" ? "[" + req.socket.localAddress + "]" : req.socket.localAddress}:${req.socket?.localPort || "80"}`;
      const protocol = req.socket?.encrypted || req.headers["x-forwarded-proto"] === "https" || req.headers[":scheme"] === "https" ? "https:" : "http:";
      super({
        protocol,
        host: host2,
        pathname,
        search
      });
    } else super(path);
    this.#req = req;
  }
  get pathname() {
    return super.pathname;
  }
  set pathname(value) {
    this._url.pathname = value;
    this.#req.url = this._url.pathname + this._url.search;
  }
};
const NodeRequestHeaders = /* @__PURE__ */ (() => {
  const NativeHeaders = globalThis.Headers;
  class Headers2 {
    #req;
    #headers;
    constructor(req) {
      this.#req = req;
    }
    static [Symbol.hasInstance](val) {
      return val instanceof NativeHeaders;
    }
    get _headers() {
      if (!this.#headers) {
        const headers2 = new NativeHeaders();
        const rawHeaders = this.#req.rawHeaders;
        const len = rawHeaders.length;
        for (let i = 0; i < len; i += 2) {
          const key2 = rawHeaders[i];
          if (key2.charCodeAt(0) === 58) continue;
          const value = rawHeaders[i + 1];
          headers2.append(key2, value);
        }
        this.#headers = headers2;
      }
      return this.#headers;
    }
    get(name) {
      if (this.#headers) return this.#headers.get(name);
      const value = this.#req.headers[name.toLowerCase()];
      return Array.isArray(value) ? value.join(", ") : value || null;
    }
    has(name) {
      if (this.#headers) return this.#headers.has(name);
      return name.toLowerCase() in this.#req.headers;
    }
    getSetCookie() {
      if (this.#headers) return this.#headers.getSetCookie();
      const value = this.#req.headers["set-cookie"];
      return Array.isArray(value) ? value : value ? [value] : [];
    }
    *_entries() {
      const rawHeaders = this.#req.rawHeaders;
      const len = rawHeaders.length;
      for (let i = 0; i < len; i += 2) {
        const key2 = rawHeaders[i];
        if (key2.charCodeAt(0) === 58) continue;
        yield [key2.toLowerCase(), rawHeaders[i + 1]];
      }
    }
    entries() {
      return this.#headers ? this.#headers.entries() : this._entries();
    }
    [Symbol.iterator]() {
      return this.entries();
    }
  }
  lazyInherit(Headers2.prototype, NativeHeaders.prototype, "_headers");
  Object.setPrototypeOf(Headers2, NativeHeaders);
  Object.setPrototypeOf(Headers2.prototype, NativeHeaders.prototype);
  return Headers2;
})();
const NodeRequest = /* @__PURE__ */ (() => {
  const NativeRequest = globalThis[/* @__PURE__ */ Symbol.for("srvx.nativeRequest")] ??= globalThis.Request;
  const PatchedRequest = class Request$1 extends NativeRequest {
    static _srvx = true;
    static [Symbol.hasInstance](instance) {
      if (this === PatchedRequest) return instance instanceof NativeRequest;
      else return Object.prototype.isPrototypeOf.call(this.prototype, instance);
    }
    constructor(input, options) {
      if (typeof input === "object" && "_request" in input) input = input._request;
      if (options?.body?.getReader !== void 0) options.duplex ??= "half";
      super(input, options);
    }
  };
  if (!globalThis.Request._srvx) globalThis.Request = PatchedRequest;
  class Request2 {
    runtime;
    #req;
    #url;
    #bodyStream;
    #request;
    #headers;
    #abortController;
    constructor(ctx) {
      this.#req = ctx.req;
      this.runtime = {
        name: "node",
        node: ctx
      };
    }
    static [Symbol.hasInstance](val) {
      return val instanceof NativeRequest;
    }
    get ip() {
      return this.#req.socket?.remoteAddress;
    }
    get method() {
      if (this.#request) return this.#request.method;
      return this.#req.method || "GET";
    }
    get _url() {
      return this.#url ||= new NodeRequestURL({ req: this.#req });
    }
    set _url(url) {
      this.#url = url;
    }
    get url() {
      if (this.#request) return this.#request.url;
      return this._url.href;
    }
    get headers() {
      if (this.#request) return this.#request.headers;
      return this.#headers ||= new NodeRequestHeaders(this.#req);
    }
    get _abortController() {
      if (!this.#abortController) {
        this.#abortController = new AbortController();
        const { req, res } = this.runtime.node;
        const abortController = this.#abortController;
        const abort = (err) => abortController.abort?.(err);
        req.once("error", abort);
        if (res) res.once("close", () => {
          const reqError = req.errored;
          if (reqError) abort(reqError);
          else if (!res.writableEnded) abort();
        });
        else req.once("close", () => {
          if (!req.complete) abort();
        });
      }
      return this.#abortController;
    }
    get signal() {
      return this.#request ? this.#request.signal : this._abortController.signal;
    }
    get body() {
      if (this.#request) return this.#request.body;
      if (this.#bodyStream === void 0) {
        const method = this.method;
        this.#bodyStream = !(method === "GET" || method === "HEAD") ? Readable.toWeb(this.#req) : null;
      }
      return this.#bodyStream;
    }
    text() {
      if (this.#request) return this.#request.text();
      if (this.#bodyStream !== void 0) return this.#bodyStream ? new Response(this.#bodyStream).text() : Promise.resolve("");
      return readBody(this.#req).then((buf) => buf.toString());
    }
    json() {
      if (this.#request) return this.#request.json();
      return this.text().then((text) => JSON.parse(text));
    }
    get _request() {
      if (!this.#request) {
        this.#request = new PatchedRequest(this.url, {
          method: this.method,
          headers: this.headers,
          body: this.body,
          signal: this._abortController.signal
        });
        this.#headers = void 0;
        this.#bodyStream = void 0;
      }
      return this.#request;
    }
  }
  lazyInherit(Request2.prototype, NativeRequest.prototype, "_request");
  Object.setPrototypeOf(Request2.prototype, NativeRequest.prototype);
  return Request2;
})();
function readBody(req) {
  return new Promise((resolve2, reject) => {
    const chunks = [];
    const onData = (chunk) => {
      chunks.push(chunk);
    };
    const onError = (err) => {
      reject(err);
    };
    const onEnd = () => {
      req.off("error", onError);
      req.off("data", onData);
      resolve2(Buffer.concat(chunks));
    };
    req.on("data", onData).once("end", onEnd).once("error", onError);
  });
}
function serve(options) {
  return new NodeServer(options);
}
var NodeServer = class {
  runtime = "node";
  options;
  node;
  serveOptions;
  fetch;
  #isSecure;
  #listeningPromise;
  #wait;
  constructor(options) {
    this.options = {
      ...options,
      middleware: [...options.middleware || []]
    };
    for (const plugin of options.plugins || []) plugin(this);
    errorPlugin(this);
    gracefulShutdownPlugin(this);
    const fetchHandler = this.fetch = wrapFetch(this);
    this.#wait = createWaitUntil();
    const handler = (nodeReq, nodeRes) => {
      const request = new NodeRequest({
        req: nodeReq,
        res: nodeRes
      });
      request.waitUntil = this.#wait.waitUntil;
      const res = fetchHandler(request);
      return res instanceof Promise ? res.then((resolvedRes) => sendNodeResponse(nodeRes, resolvedRes)) : sendNodeResponse(nodeRes, res);
    };
    const tls = resolveTLSOptions(this.options);
    const { port: port2, hostname: host2 } = resolvePortAndHost(this.options);
    this.serveOptions = {
      port: port2,
      host: host2,
      exclusive: !this.options.reusePort,
      ...tls ? {
        cert: tls.cert,
        key: tls.key,
        passphrase: tls.passphrase
      } : {},
      ...this.options.node
    };
    let server;
    this.#isSecure = !!this.serveOptions.cert && this.options.protocol !== "http";
    if (this.options.node?.http2 ?? this.#isSecure) if (this.#isSecure) server = nodeHTTP2.createSecureServer({
      allowHTTP1: true,
      ...this.serveOptions
    }, handler);
    else throw new Error("node.http2 option requires tls certificate!");
    else if (this.#isSecure) server = nodeHTTPS.createServer(this.serveOptions, handler);
    else server = nodeHTTP.createServer(this.serveOptions, handler);
    this.node = {
      server,
      handler
    };
    if (!options.manual) this.serve();
  }
  serve() {
    if (this.#listeningPromise) return Promise.resolve(this.#listeningPromise).then(() => this);
    this.#listeningPromise = new Promise((resolve2) => {
      this.node.server.listen(this.serveOptions, () => {
        printListening(this.options, this.url);
        resolve2();
      });
    });
  }
  get url() {
    const addr = this.node?.server?.address();
    if (!addr) return;
    return typeof addr === "string" ? addr : fmtURL(addr.address, addr.port, this.#isSecure);
  }
  ready() {
    return Promise.resolve(this.#listeningPromise).then(() => this);
  }
  async close(closeAll) {
    await Promise.all([this.#wait.wait(), new Promise((resolve2, reject) => {
      const server = this.node?.server;
      if (!server) return resolve2();
      if (closeAll && "closeAllConnections" in server) server.closeAllConnections();
      server.close((error) => error ? reject(error) : resolve2());
    })]);
  }
};
const NullProtoObj = /* @__PURE__ */ (() => {
  const e = function() {
  };
  return e.prototype = /* @__PURE__ */ Object.create(null), Object.freeze(e.prototype), e;
})();
const kEventNS = "h3.internal.event.";
const kEventRes = /* @__PURE__ */ Symbol.for(`${kEventNS}res`);
const kEventResHeaders = /* @__PURE__ */ Symbol.for(`${kEventNS}res.headers`);
var H3Event = class {
  app;
  req;
  url;
  context;
  static __is_event__ = true;
  constructor(req, context, app) {
    this.context = context || req.context || new NullProtoObj();
    this.req = req;
    this.app = app;
    const _url = req._url;
    this.url = _url && _url instanceof URL ? _url : new FastURL(req.url);
  }
  get res() {
    return this[kEventRes] ||= new H3EventResponse();
  }
  get runtime() {
    return this.req.runtime;
  }
  waitUntil(promise) {
    this.req.waitUntil?.(promise);
  }
  toString() {
    return `[${this.req.method}] ${this.req.url}`;
  }
  toJSON() {
    return this.toString();
  }
  get node() {
    return this.req.runtime?.node;
  }
  get headers() {
    return this.req.headers;
  }
  get path() {
    return this.url.pathname + this.url.search;
  }
  get method() {
    return this.req.method;
  }
};
var H3EventResponse = class {
  status;
  statusText;
  get headers() {
    return this[kEventResHeaders] ||= new Headers();
  }
};
const DISALLOWED_STATUS_CHARS = /[^\u0009\u0020-\u007E]/g;
function sanitizeStatusMessage(statusMessage = "") {
  return statusMessage.replace(DISALLOWED_STATUS_CHARS, "");
}
function sanitizeStatusCode(statusCode, defaultStatusCode = 200) {
  if (!statusCode) return defaultStatusCode;
  if (typeof statusCode === "string") statusCode = +statusCode;
  if (statusCode < 100 || statusCode > 599) return defaultStatusCode;
  return statusCode;
}
var HTTPError = class HTTPError2 extends Error {
  get name() {
    return "HTTPError";
  }
  status;
  statusText;
  headers;
  cause;
  data;
  body;
  unhandled;
  static isError(input) {
    return input instanceof Error && input?.name === "HTTPError";
  }
  static status(status, statusText, details) {
    return new HTTPError2({
      ...details,
      statusText,
      status
    });
  }
  constructor(arg1, arg2) {
    let messageInput;
    let details;
    if (typeof arg1 === "string") {
      messageInput = arg1;
      details = arg2;
    } else details = arg1;
    const status = sanitizeStatusCode(details?.status || details?.cause?.status || details?.status || details?.statusCode, 500);
    const statusText = sanitizeStatusMessage(details?.statusText || details?.cause?.statusText || details?.statusText || details?.statusMessage);
    const message = messageInput || details?.message || details?.cause?.message || details?.statusText || details?.statusMessage || [
      "HTTPError",
      status,
      statusText
    ].filter(Boolean).join(" ");
    super(message, { cause: details });
    this.cause = details;
    Error.captureStackTrace?.(this, this.constructor);
    this.status = status;
    this.statusText = statusText || void 0;
    const rawHeaders = details?.headers || details?.cause?.headers;
    this.headers = rawHeaders ? new Headers(rawHeaders) : void 0;
    this.unhandled = details?.unhandled ?? details?.cause?.unhandled ?? void 0;
    this.data = details?.data;
    this.body = details?.body;
  }
  get statusCode() {
    return this.status;
  }
  get statusMessage() {
    return this.statusText;
  }
  toJSON() {
    const unhandled = this.unhandled;
    return {
      status: this.status,
      statusText: this.statusText,
      unhandled,
      message: unhandled ? "HTTPError" : this.message,
      data: unhandled ? void 0 : this.data,
      ...unhandled ? void 0 : this.body
    };
  }
};
function isJSONSerializable(value, _type) {
  if (value === null || value === void 0) return true;
  if (_type !== "object") return _type === "boolean" || _type === "number" || _type === "string";
  if (typeof value.toJSON === "function") return true;
  if (Array.isArray(value)) return true;
  if (typeof value.pipe === "function" || typeof value.pipeTo === "function") return false;
  if (value instanceof NullProtoObj) return true;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}
const kNotFound = /* @__PURE__ */ Symbol.for("h3.notFound");
const kHandled = /* @__PURE__ */ Symbol.for("h3.handled");
function toResponse(val, event, config = {}) {
  if (typeof val?.then === "function") return (val.catch?.((error) => error) || Promise.resolve(val)).then((resolvedVal) => toResponse(resolvedVal, event, config));
  const response = prepareResponse(val, event, config);
  if (typeof response?.then === "function") return toResponse(response, event, config);
  const { onResponse: onResponse$1 } = config;
  return onResponse$1 ? Promise.resolve(onResponse$1(response, event)).then(() => response) : response;
}
var HTTPResponse = class {
  #headers;
  #init;
  body;
  constructor(body, init) {
    this.body = body;
    this.#init = init;
  }
  get status() {
    return this.#init?.status || 200;
  }
  get statusText() {
    return this.#init?.statusText || "OK";
  }
  get headers() {
    return this.#headers ||= new Headers(this.#init?.headers);
  }
};
function prepareResponse(val, event, config, nested) {
  if (val === kHandled) return new NodeResponse(null);
  if (val === kNotFound) val = new HTTPError({
    status: 404,
    message: `Cannot find any route matching [${event.req.method}] ${event.url}`
  });
  if (val && val instanceof Error) {
    const isHTTPError = HTTPError.isError(val);
    const error = isHTTPError ? val : new HTTPError(val);
    if (!isHTTPError) {
      error.unhandled = true;
      if (val?.stack) error.stack = val.stack;
    }
    if (error.unhandled && !config.silent) console.error(error);
    const { onError: onError$1 } = config;
    return onError$1 && !nested ? Promise.resolve(onError$1(error, event)).catch((error$1) => error$1).then((newVal) => prepareResponse(newVal ?? val, event, config, true)) : errorResponse(error, config.debug);
  }
  const preparedRes = event[kEventRes];
  const preparedHeaders = preparedRes?.[kEventResHeaders];
  if (!(val instanceof Response)) {
    const res = prepareResponseBody(val, event, config);
    const status = res.status || preparedRes?.status;
    return new NodeResponse(nullBody(event.req.method, status) ? null : res.body, {
      status,
      statusText: res.statusText || preparedRes?.statusText,
      headers: res.headers && preparedHeaders ? mergeHeaders$1(res.headers, preparedHeaders) : res.headers || preparedHeaders
    });
  }
  if (!preparedHeaders || nested || !val.ok) return val;
  try {
    mergeHeaders$1(val.headers, preparedHeaders, val.headers);
    return val;
  } catch {
    return new NodeResponse(nullBody(event.req.method, val.status) ? null : val.body, {
      status: val.status,
      statusText: val.statusText,
      headers: mergeHeaders$1(val.headers, preparedHeaders)
    });
  }
}
function mergeHeaders$1(base, overrides, target = new Headers(base)) {
  for (const [name, value] of overrides) if (name === "set-cookie") target.append(name, value);
  else target.set(name, value);
  return target;
}
const frozenHeaders = () => {
  throw new Error("Headers are frozen");
};
var FrozenHeaders = class extends Headers {
  constructor(init) {
    super(init);
    this.set = this.append = this.delete = frozenHeaders;
  }
};
const emptyHeaders = /* @__PURE__ */ new FrozenHeaders({ "content-length": "0" });
const jsonHeaders = /* @__PURE__ */ new FrozenHeaders({ "content-type": "application/json;charset=UTF-8" });
function prepareResponseBody(val, event, config) {
  if (val === null || val === void 0) return {
    body: "",
    headers: emptyHeaders
  };
  const valType = typeof val;
  if (valType === "string") return { body: val };
  if (val instanceof Uint8Array) {
    event.res.headers.set("content-length", val.byteLength.toString());
    return { body: val };
  }
  if (val instanceof HTTPResponse || val?.constructor?.name === "HTTPResponse") return val;
  if (isJSONSerializable(val, valType)) return {
    body: JSON.stringify(val, void 0, config.debug ? 2 : void 0),
    headers: jsonHeaders
  };
  if (valType === "bigint") return {
    body: val.toString(),
    headers: jsonHeaders
  };
  if (val instanceof Blob) {
    const headers2 = new Headers({
      "content-type": val.type,
      "content-length": val.size.toString()
    });
    let filename = val.name;
    if (filename) {
      filename = encodeURIComponent(filename);
      headers2.set("content-disposition", `filename="${filename}"; filename*=UTF-8''${filename}`);
    }
    return {
      body: val.stream(),
      headers: headers2
    };
  }
  if (valType === "symbol") return { body: val.toString() };
  if (valType === "function") return { body: `${val.name}()` };
  return { body: val };
}
function nullBody(method, status) {
  return method === "HEAD" || status === 100 || status === 101 || status === 102 || status === 204 || status === 205 || status === 304;
}
function errorResponse(error, debug) {
  return new NodeResponse(JSON.stringify({
    ...error.toJSON(),
    stack: debug && error.stack ? error.stack.split("\n").map((l) => l.trim()) : void 0
  }, void 0, debug ? 2 : void 0), {
    status: error.status,
    statusText: error.statusText,
    headers: error.headers ? mergeHeaders$1(jsonHeaders, error.headers) : new Headers(jsonHeaders)
  });
}
function callMiddleware(event, middleware, handler, index = 0) {
  if (index === middleware.length) return handler(event);
  const fn = middleware[index];
  let nextCalled;
  let nextResult;
  const next = () => {
    if (nextCalled) return nextResult;
    nextCalled = true;
    nextResult = callMiddleware(event, middleware, handler, index + 1);
    return nextResult;
  };
  const ret = fn(event, next);
  return isUnhandledResponse(ret) ? next() : typeof ret?.then === "function" ? ret.then((resolved) => isUnhandledResponse(resolved) ? next() : resolved) : ret;
}
function isUnhandledResponse(val) {
  return val === void 0 || val === kNotFound;
}
function toRequest(input, options) {
  if (typeof input === "string") {
    let url = input;
    if (url[0] === "/") {
      const host2 = "localhost";
      url = `${"http"}://${host2}${url}`;
    }
    return new Request(url, options);
  } else if (input instanceof URL) return new Request(input, options);
  return input;
}
function defineHandler(input) {
  if (typeof input === "function") return handlerWithFetch(input);
  const handler = input.handler || (input.fetch ? function _fetchHandler(event) {
    return input.fetch(event.req);
  } : NoHandler);
  return Object.assign(handlerWithFetch(input.middleware?.length ? function _handlerMiddleware(event) {
    return callMiddleware(event, input.middleware, handler);
  } : handler), input);
}
function handlerWithFetch(handler) {
  if ("fetch" in handler) return handler;
  return Object.assign(handler, { fetch: (req) => {
    if (typeof req === "string") req = new URL(req, "http://_");
    if (req instanceof URL) req = new Request(req);
    const event = new H3Event(req);
    try {
      return Promise.resolve(toResponse(handler(event), event));
    } catch (error) {
      return Promise.resolve(toResponse(error, event));
    }
  } });
}
function defineLazyEventHandler(loader) {
  let handler;
  let promise;
  const resolveLazyHandler = () => {
    if (handler) return Promise.resolve(handler);
    return promise ??= Promise.resolve(loader()).then((r) => {
      handler = toEventHandler(r) || toEventHandler(r.default);
      if (typeof handler !== "function") throw new TypeError("Invalid lazy handler", { cause: { resolved: r } });
      return handler;
    });
  };
  return defineHandler(function lazyHandler(event) {
    return handler ? handler(event) : resolveLazyHandler().then((r) => r(event));
  });
}
function toEventHandler(handler) {
  if (typeof handler === "function") return handler;
  if (typeof handler?.handler === "function") return handler.handler;
  if (typeof handler?.fetch === "function") return function _fetchHandler(event) {
    return handler.fetch(event.req);
  };
}
const NoHandler = () => kNotFound;
var H3Core = class {
  config;
  "~middleware";
  "~routes" = [];
  constructor(config = {}) {
    this["~middleware"] = [];
    this.config = config;
    this.fetch = this.fetch.bind(this);
    this.handler = this.handler.bind(this);
  }
  fetch(request) {
    return this["~request"](request);
  }
  handler(event) {
    const route = this["~findRoute"](event);
    if (route) {
      event.context.params = route.params;
      event.context.matchedRoute = route.data;
    }
    const routeHandler = route?.data.handler || NoHandler;
    const middleware = this["~getMiddleware"](event, route);
    return middleware.length > 0 ? callMiddleware(event, middleware, routeHandler) : routeHandler(event);
  }
  "~request"(request, context) {
    const event = new H3Event(request, context, this);
    let handlerRes;
    try {
      if (this.config.onRequest) {
        const hookRes = this.config.onRequest(event);
        handlerRes = typeof hookRes?.then === "function" ? hookRes.then(() => this.handler(event)) : this.handler(event);
      } else handlerRes = this.handler(event);
    } catch (error) {
      handlerRes = Promise.reject(error);
    }
    return toResponse(handlerRes, event, this.config);
  }
  "~findRoute"(_event) {
  }
  "~addRoute"(_route) {
    this["~routes"].push(_route);
  }
  "~getMiddleware"(_event, route) {
    const routeMiddleware = route?.data.middleware;
    const globalMiddleware2 = this["~middleware"];
    return routeMiddleware ? [...globalMiddleware2, ...routeMiddleware] : globalMiddleware2;
  }
};
const errorHandler$1 = (error, event) => {
  const res = defaultHandler(error, event);
  return new NodeResponse(typeof res.body === "string" ? res.body : JSON.stringify(res.body, null, 2), res);
};
function defaultHandler(error, event, opts) {
  const isSensitive = error.unhandled;
  const status = error.status || 500;
  const url = event.url || new URL(event.req.url);
  if (status === 404) {
    const baseURL = "/";
    if (/^\/[^/]/.test(baseURL) && !url.pathname.startsWith(baseURL)) {
      const redirectTo = `${baseURL}${url.pathname.slice(1)}${url.search}`;
      return {
        status: 302,
        statusText: "Found",
        headers: { location: redirectTo },
        body: `Redirecting...`
      };
    }
  }
  if (isSensitive && !opts?.silent) {
    const tags = [error.unhandled && "[unhandled]"].filter(Boolean).join(" ");
    console.error(`[request error] ${tags} [${event.req.method}] ${url}
`, error);
  }
  const headers2 = {
    "content-type": "application/json",
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "referrer-policy": "no-referrer",
    "content-security-policy": "script-src 'none'; frame-ancestors 'none';"
  };
  if (status === 404 || !event.res.headers.has("cache-control")) {
    headers2["cache-control"] = "no-cache";
  }
  const body = {
    error: true,
    url: url.href,
    status,
    statusText: error.statusText,
    message: isSensitive ? "Server Error" : error.message,
    data: isSensitive ? void 0 : error.data
  };
  return {
    status,
    statusText: error.statusText,
    headers: headers2,
    body
  };
}
const errorHandlers = [errorHandler$1];
async function errorHandler(error, event) {
  for (const handler of errorHandlers) {
    try {
      const response = await handler(error, event, { defaultHandler });
      if (response) {
        return response;
      }
    } catch (error2) {
      console.error(error2);
    }
  }
}
const ENC_SLASH_RE = /%2f/gi;
function decode(text = "") {
  try {
    return decodeURIComponent("" + text);
  } catch {
    return "" + text;
  }
}
function decodePath(text) {
  return decode(text.replace(ENC_SLASH_RE, "%252F"));
}
const JOIN_LEADING_SLASH_RE = /^\.?\//;
function hasTrailingSlash(input = "", respectQueryAndFragment) {
  {
    return input.endsWith("/");
  }
}
function withoutTrailingSlash(input = "", respectQueryAndFragment) {
  {
    return (hasTrailingSlash(input) ? input.slice(0, -1) : input) || "/";
  }
}
function withTrailingSlash(input = "", respectQueryAndFragment) {
  {
    return input.endsWith("/") ? input : input + "/";
  }
}
function hasLeadingSlash(input = "") {
  return input.startsWith("/");
}
function withLeadingSlash(input = "") {
  return hasLeadingSlash(input) ? input : "/" + input;
}
function isNonEmptyURL(url) {
  return url && url !== "/";
}
function joinURL(base, ...input) {
  let url = base || "";
  for (const segment of input.filter((url2) => isNonEmptyURL(url2))) {
    if (url) {
      const _segment = segment.replace(JOIN_LEADING_SLASH_RE, "");
      url = withTrailingSlash(url) + _segment;
    } else {
      url = segment;
    }
  }
  return url;
}
const headers = ((m) => function headersRouteRule(event) {
  for (const [key2, value] of Object.entries(m.options || {})) {
    event.res.headers.set(key2, value);
  }
});
const assets = {
  "/manifest.json": {
    "type": "application/json",
    "etag": '"1f2-Oqn/x1R1hBTtEjA8nFhpBeFJJNg"',
    "mtime": "2026-02-02T02:53:30.360Z",
    "size": 498,
    "path": "../public/manifest.json"
  },
  "/robots.txt": {
    "type": "text/plain; charset=utf-8",
    "etag": '"43-BEzmj4PuhUNHX+oW9uOnPSihxtU"',
    "mtime": "2026-02-02T02:53:30.360Z",
    "size": 67,
    "path": "../public/robots.txt"
  },
  "/assets/globals-CqS46bKL.css": {
    "type": "text/css; charset=utf-8",
    "etag": '"19056-7n7GZScny8R58FwelDvwVs3GDSM"',
    "mtime": "2026-02-02T02:53:30.485Z",
    "size": 102486,
    "path": "../public/assets/globals-CqS46bKL.css"
  },
  "/assets/index-DNu5F4n9.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"34b-ewZkqWoX72WngSApAJjhgb67FSk"',
    "mtime": "2026-02-02T02:53:30.485Z",
    "size": 843,
    "path": "../public/assets/index-DNu5F4n9.js"
  },
  "/assets/main-6Ok3v-i9.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"74ba3-4ff3ju6c0FfSckUwwHRMcCrzy7Y"',
    "mtime": "2026-02-02T02:53:30.485Z",
    "size": 478115,
    "path": "../public/assets/main-6Ok3v-i9.js"
  }
};
function readAsset(id) {
  const serverDir = dirname(fileURLToPath(globalThis.__nitro_main__));
  return promises.readFile(resolve(serverDir, assets[id].path));
}
const publicAssetBases = {};
function isPublicAssetURL(id = "") {
  if (assets[id]) {
    return true;
  }
  for (const base in publicAssetBases) {
    if (id.startsWith(base)) {
      return true;
    }
  }
  return false;
}
function getAsset(id) {
  return assets[id];
}
const METHODS = /* @__PURE__ */ new Set(["HEAD", "GET"]);
const EncodingMap = {
  gzip: ".gz",
  br: ".br"
};
const _cpyTUM = defineHandler((event) => {
  if (event.req.method && !METHODS.has(event.req.method)) {
    return;
  }
  let id = decodePath(withLeadingSlash(withoutTrailingSlash(event.url.pathname)));
  let asset;
  const encodingHeader = event.req.headers.get("accept-encoding") || "";
  const encodings = [...encodingHeader.split(",").map((e) => EncodingMap[e.trim()]).filter(Boolean).sort(), ""];
  if (encodings.length > 1) {
    event.res.headers.append("Vary", "Accept-Encoding");
  }
  for (const encoding of encodings) {
    for (const _id of [id + encoding, joinURL(id, "index.html" + encoding)]) {
      const _asset = getAsset(_id);
      if (_asset) {
        asset = _asset;
        id = _id;
        break;
      }
    }
  }
  if (!asset) {
    if (isPublicAssetURL(id)) {
      event.res.headers.delete("Cache-Control");
      throw new HTTPError({ status: 404 });
    }
    return;
  }
  const ifNotMatch = event.req.headers.get("if-none-match") === asset.etag;
  if (ifNotMatch) {
    event.res.status = 304;
    event.res.statusText = "Not Modified";
    return "";
  }
  const ifModifiedSinceH = event.req.headers.get("if-modified-since");
  const mtimeDate = new Date(asset.mtime);
  if (ifModifiedSinceH && asset.mtime && new Date(ifModifiedSinceH) >= mtimeDate) {
    event.res.status = 304;
    event.res.statusText = "Not Modified";
    return "";
  }
  if (asset.type) {
    event.res.headers.set("Content-Type", asset.type);
  }
  if (asset.etag && !event.res.headers.has("ETag")) {
    event.res.headers.set("ETag", asset.etag);
  }
  if (asset.mtime && !event.res.headers.has("Last-Modified")) {
    event.res.headers.set("Last-Modified", mtimeDate.toUTCString());
  }
  if (asset.encoding && !event.res.headers.has("Content-Encoding")) {
    event.res.headers.set("Content-Encoding", asset.encoding);
  }
  if (asset.size > 0 && !event.res.headers.has("Content-Length")) {
    event.res.headers.set("Content-Length", asset.size.toString());
  }
  return readAsset(id);
});
const findRouteRules = /* @__PURE__ */ (() => {
  const $0 = [{ name: "headers", route: "/assets/**", handler: headers, options: { "cache-control": "public, max-age=31536000, immutable" } }];
  return (m, p) => {
    let r = [];
    if (p.charCodeAt(p.length - 1) === 47) p = p.slice(0, -1) || "/";
    let s = p.split("/");
    s.length - 1;
    if (s[1] === "assets") {
      r.unshift({ data: $0, params: { "_": s.slice(2).join("/") } });
    }
    return r;
  };
})();
const _lazy_ZkFylG = defineLazyEventHandler(() => Promise.resolve().then(function() {
  return ssrRenderer$1;
}));
const findRoute = /* @__PURE__ */ (() => {
  const data = { route: "/**", handler: _lazy_ZkFylG };
  return ((_m, p) => {
    return { data, params: { "_": p.slice(1) } };
  });
})();
const globalMiddleware = [
  toEventHandler(_cpyTUM)
].filter(Boolean);
function useNitroApp() {
  return useNitroApp.__instance__ ??= initNitroApp();
}
function initNitroApp() {
  const nitroApp2 = createNitroApp();
  globalThis.__nitro__ = nitroApp2;
  return nitroApp2;
}
function createNitroApp() {
  const hooks = void 0;
  const captureError = (error, errorCtx) => {
    if (errorCtx?.event) {
      const errors = errorCtx.event.req.context?.nitro?.errors;
      if (errors) {
        errors.push({
          error,
          context: errorCtx
        });
      }
    }
  };
  const h3App = createH3App({ onError(error, event) {
    return errorHandler(error, event);
  } });
  let appHandler = (req) => {
    req.context ||= {};
    req.context.nitro = req.context.nitro || { errors: [] };
    return h3App.fetch(req);
  };
  const app = {
    fetch: appHandler,
    h3: h3App,
    hooks,
    captureError
  };
  return app;
}
function createH3App(config) {
  const h3App = new H3Core(config);
  h3App["~findRoute"] = (event) => findRoute(event.req.method, event.url.pathname);
  h3App["~middleware"].push(...globalMiddleware);
  {
    h3App["~getMiddleware"] = (event, route) => {
      const pathname = event.url.pathname;
      const method = event.req.method;
      const middleware = [];
      {
        const routeRules = getRouteRules(method, pathname);
        event.context.routeRules = routeRules?.routeRules;
        if (routeRules?.routeRuleMiddleware.length) {
          middleware.push(...routeRules.routeRuleMiddleware);
        }
      }
      middleware.push(...h3App["~middleware"]);
      if (route?.data?.middleware?.length) {
        middleware.push(...route.data.middleware);
      }
      return middleware;
    };
  }
  return h3App;
}
function getRouteRules(method, pathname) {
  const m = findRouteRules(method, pathname);
  if (!m?.length) {
    return { routeRuleMiddleware: [] };
  }
  const routeRules = {};
  for (const layer of m) {
    for (const rule of layer.data) {
      const currentRule = routeRules[rule.name];
      if (currentRule) {
        if (rule.options === false) {
          delete routeRules[rule.name];
          continue;
        }
        if (typeof currentRule.options === "object" && typeof rule.options === "object") {
          currentRule.options = {
            ...currentRule.options,
            ...rule.options
          };
        } else {
          currentRule.options = rule.options;
        }
        currentRule.route = rule.route;
        currentRule.params = {
          ...currentRule.params,
          ...layer.params
        };
      } else if (rule.options !== false) {
        routeRules[rule.name] = {
          ...rule,
          params: layer.params
        };
      }
    }
  }
  const middleware = [];
  for (const rule of Object.values(routeRules)) {
    if (rule.options === false || !rule.handler) {
      continue;
    }
    middleware.push(rule.handler(rule));
  }
  return {
    routeRules,
    routeRuleMiddleware: middleware
  };
}
function _captureError(error, type) {
  console.error(`[${type}]`, error);
  useNitroApp().captureError?.(error, { tags: [type] });
}
function trapUnhandledErrors() {
  process.on("unhandledRejection", (error) => _captureError(error, "unhandledRejection"));
  process.on("uncaughtException", (error) => _captureError(error, "uncaughtException"));
}
const port = Number.parseInt(process.env.NITRO_PORT || process.env.PORT || "") || 3e3;
const host = process.env.NITRO_HOST || process.env.HOST;
const cert = process.env.NITRO_SSL_CERT;
const key = process.env.NITRO_SSL_KEY;
const nitroApp = useNitroApp();
serve({
  port,
  hostname: host,
  tls: cert && key ? {
    cert,
    key
  } : void 0,
  fetch: nitroApp.fetch
});
trapUnhandledErrors();
const nodeServer = {};
function fetchViteEnv(viteEnvName, input, init) {
  const envs = globalThis.__nitro_vite_envs__ || {};
  const viteEnv = envs[viteEnvName];
  if (!viteEnv) {
    throw HTTPError.status(404);
  }
  return Promise.resolve(viteEnv.fetch(toRequest(input, init)));
}
function ssrRenderer({ req }) {
  return fetchViteEnv("ssr", req);
}
const ssrRenderer$1 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  default: ssrRenderer
});
export {
  nodeServer as default
};
