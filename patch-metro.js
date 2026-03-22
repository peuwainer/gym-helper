const Module = require('module');
const path = require('path');
const fs = require('fs');

const NM = path.join(__dirname, 'node_modules');

const original = Module._resolveFilename;

Module._resolveFilename = function (request, parent, isMain, options) {
  try {
    return original.call(this, request, parent, isMain, options);
  } catch (err) {
    if (
      err.code === 'ERR_PACKAGE_PATH_NOT_EXPORTED' ||
      err.code === 'ERR_MODULE_NOT_FOUND'
    ) {
      const match = request.match(/^((?:@[^/]+\/)?[^/]+)\/(.+)$/);
      if (match) {
        const [, pkgName, subpath] = match;
        const pkgDir = path.join(NM, pkgName);
        if (fs.existsSync(pkgDir)) {
          // subpath may contain the "private" alias — map private/* to src/*
          const resolvedSubpath = subpath.startsWith('private/')
            ? 'src/' + subpath.slice('private/'.length)
            : subpath;

          const candidates = [
            path.join(pkgDir, resolvedSubpath),
            path.join(pkgDir, resolvedSubpath + '.js'),
            path.join(pkgDir, resolvedSubpath.replace(/\.js$/, '') + '.js'),
          ];
          for (const candidate of candidates) {
            if (fs.existsSync(candidate)) {
              return candidate;
            }
          }
        }
      }
    }
    throw err;
  }
};
