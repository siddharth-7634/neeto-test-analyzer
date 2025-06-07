"use strict";
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __generator =
  (this && this.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g = Object.create(
        (typeof Iterator === "function" ? Iterator : Object).prototype
      );
    return (
      (g.next = verb(0)),
      (g["throw"] = verb(1)),
      (g["return"] = verb(2)),
      typeof Symbol === "function" &&
        (g[Symbol.iterator] = function () {
          return this;
        }),
      g
    );
    function verb(n) {
      return function (v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError("Generator is already executing.");
      while ((g && ((g = 0), op[0] && (_ = 0)), _))
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y["return"]
                  : op[0]
                  ? y["throw"] || ((t = y["return"]) && t.call(y), 0)
                  : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
var __spreadArray =
  (this && this.__spreadArray) ||
  function (to, from, pack) {
    if (pack || arguments.length === 2)
      for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
          if (!ar) ar = Array.prototype.slice.call(from, 0, i);
          ar[i] = from[i];
        }
      }
    return to.concat(ar || Array.prototype.slice.call(from));
  };
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var path = require("path");
var axios_1 = require("axios");
var unzipper_1 = require("unzipper");
var downloadAndExtractTrace = function (traceZipUrl, outputDir) {
  return __awaiter(void 0, void 0, void 0, function () {
    var zipPath, response, writer;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          zipPath = path.join(outputDir, "trace.zip");
          // Ensure output directory exists
          fs.mkdirSync(outputDir, { recursive: true });
          return [
            4 /*yield*/,
            (0, axios_1.default)({
              method: "GET",
              url: encodeURI(traceZipUrl),
              responseType: "stream",
            }),
          ];
        case 1:
          response = _a.sent();
          writer = fs.createWriteStream(zipPath);
          response.data.pipe(writer);
          return [
            4 /*yield*/,
            new Promise(function (resolve, reject) {
              writer.on("finish", function () {
                return resolve(undefined);
              });
              writer.on("error", reject);
            }),
          ];
        case 2:
          _a.sent();
          return [
            4 /*yield*/,
            fs
              .createReadStream(zipPath)
              .pipe(unzipper_1.default.Extract({ path: outputDir }))
              .promise(),
          ];
        case 3:
          _a.sent();
          // console.log("✅ Trace file downloaded and extracted.");
          return [2 /*return*/];
      }
    });
  });
};
var parseTrace = function (outputDir) {
  return __awaiter(void 0, void 0, void 0, function () {
    var traceFile, content, lines, actions, lastError;
    return __generator(this, function (_a) {
      traceFile = path.join(outputDir, "trace.trace");
      if (!fs.existsSync(traceFile)) {
        throw new Error("trace.trace file not found in extracted zip.");
      }
      content = fs.readFileSync(traceFile, "utf-8");
      lines = content
        .trim()
        .split("\n")
        .map(function (line) {
          return JSON.parse(line);
        });
      actions = lines.filter(function (entry) {
        return entry.type === "action";
      });
      lastError = __spreadArray([], lines, true)
        .reverse()
        .find(function (entry) {
          var _a, _b;
          return (_b =
            (_a = entry.metadata) === null || _a === void 0
              ? void 0
              : _a.error) === null || _b === void 0
            ? void 0
            : _b.message;
        });
      return [
        2 /*return*/,
        {
          totalActions: actions.length,
          lastError: lastError,
        },
      ];
    });
  });
};
var runAnalysis = function () {
  return __awaiter(void 0, void 0, void 0, function () {
    var traceZipUrl, outputDir, result, err_1;
    var _a, _b, _c;
    return __generator(this, function (_d) {
      switch (_d.label) {
        case 0:
          traceZipUrl =
            "https://assets-cdn.neetoplaydash.com/rails/active_storage/blobs/proxy/eyJfcmFpbHMiOnsiZGF0YSI6ImYzYTg4YmU3LWQ1MDgtNDE1Yi05NThhLWE0MzFjYjI4ZDdmYiIsInB1ciI6ImJsb2JfaWQifX0=--82f879f8b5b825282baaf40a03a20af18257798e/-home-neetoci-neeto-invoice-web-playwright-tests-test-results-invoice-Verify-invoices-sh-b6847-oice-email-and-invoice-link-chromium-retry1-trace.zip";
          outputDir = path.join(__dirname, "trace-extracted");
          _d.label = 1;
        case 1:
          _d.trys.push([1, 4, , 5]);
          return [4 /*yield*/, downloadAndExtractTrace(traceZipUrl, outputDir)];
        case 2:
          _d.sent();
          return [4 /*yield*/, parseTrace(outputDir)];
        case 3:
          result = _d.sent();
          // console.log("📊 Trace Summary:");
          // console.log("Total Actions: ".concat(result.totalActions));
          if (
            (_c =
              (_b =
                (_a = result.lastError) === null || _a === void 0
                  ? void 0
                  : _a.metadata) === null || _b === void 0
                ? void 0
                : _b.error) === null || _c === void 0
              ? void 0
              : _c.message
          ) {
            // console.log("\u274C Last Error: ".concat(result.lastError.metadata.error.message));
          } else {
            // console.log("✅ No error found in trace.");
          }
          return [3 /*break*/, 5];
        case 4:
          err_1 = _d.sent();
          console.error("⚠️ Error during trace analysis:", err_1);
          return [3 /*break*/, 5];
        case 5:
          return [2 /*return*/];
      }
    });
  });
};
runAnalysis();
