"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var api_1 = require("@polkadot/api");
var types_1 = require("@joystream/types");
var blocksFound = [];
var eraStats = [];
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var provider, api, firstBlock, lastBlock, era, eraStatsNew, authors, i, blocksFoundNew, blockHeight, hash, newEra, _a, eraPoints, timestampStarted, startHeight, timestampEnded, _b, individualPoints;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    provider = new api_1.WsProvider('ws://127.0.0.1:9944');
                    return [4 /*yield*/, api_1.ApiPromise.create({ provider: provider, types: types_1.types })];
                case 1:
                    api = _c.sent();
                    firstBlock = 1073741;
                    lastBlock = 1276285;
                    era = 807;
                    eraStatsNew = eraStats;
                    authors = [];
                    for (i = 0; i < blocksFound.length; i++) {
                        authors.push(blocksFound[i].author);
                    }
                    blocksFoundNew = blocksFound;
                    blockHeight = firstBlock;
                    _c.label = 2;
                case 2:
                    if (!(blockHeight < lastBlock)) return [3 /*break*/, 8];
                    return [4 /*yield*/, api.rpc.chain.getBlockHash(blockHeight)];
                case 3:
                    hash = _c.sent();
                    _a = Number;
                    return [4 /*yield*/, api.query.staking.activeEra.at(hash)];
                case 4:
                    newEra = _a.apply(void 0, [(_c.sent()).unwrap().index.toBigInt()]);
                    if (!(newEra > era)) return [3 /*break*/, 7];
                    console.log(era);
                    return [4 /*yield*/, api.query.staking.erasRewardPoints.at(hash, era)];
                case 5:
                    eraPoints = _c.sent();
                    timestampStarted = eraStatsNew[eraStatsNew.length - 1].timestampEnded;
                    startHeight = eraStatsNew[eraStatsNew.length - 1].endHeight;
                    _b = Number;
                    return [4 /*yield*/, api.query.staking.activeEra.at(hash)];
                case 6:
                    timestampEnded = _b.apply(void 0, [(_c.sent()).unwrap().start.unwrap().toBigInt()]);
                    eraStatsNew.push({
                        eraNumber: era,
                        startHeight: startHeight,
                        endHeight: blockHeight,
                        timestampStarted: timestampStarted,
                        timestampEnded: timestampEnded,
                        totalPoints: Number(eraPoints.total.toBigInt())
                    });
                    individualPoints = eraPoints.individual;
                    individualPoints.forEach(function (points, author) {
                        var index = authors.indexOf(author.toString());
                        if (index != -1) {
                            blocksFoundNew[index].activeEras.push(era);
                            blocksFoundNew[index].eraPoints += Number(points.toBigInt());
                        }
                        else {
                            authors.push(author.toString());
                            blocksFoundNew.push({
                                author: author.toString(),
                                activeEras: [era],
                                eraPoints: Number(points.toBigInt())
                            });
                        }
                    });
                    era = newEra;
                    _c.label = 7;
                case 7:
                    blockHeight += 1;
                    return [3 /*break*/, 2];
                case 8:
                    console.log("blocksFoundNew = ", JSON.stringify(blocksFoundNew, null, 4));
                    console.log("eraStatsNew = ", JSON.stringify(eraStatsNew, null, 4));
                    api.disconnect();
                    return [2 /*return*/];
            }
        });
    });
}
main();
