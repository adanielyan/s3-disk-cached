const path = require("path");
const expect = require("chai").expect;
const nockBack = require('nock').back;
const s3 = require("./../lib/s3-cached")({
  // bucket with public access for easy cassette re-recording
  bucket: 's3-cached-test-bucket'
});

nockBack.setMode('record');
nockBack.fixtures = path.join(__dirname, "__cassette");

describe("Testing S3-Cached", () => {
  it("Testing JSON Not Found", (done) => {
    nockBack(`unknown-file.json_recording.json`, {}, (nockDone) => {
      s3.getJsonObjectCached("unknown-file.json").catch((err) => {
        expect(["The specified key does not exist.", "Access Denied"]).to.contain(err.message);
        nockDone();
        done();
      });
    });
  });

  it("Testing Invalid JSON", (done) => {
    nockBack(`invalid.json_recording.json`, {}, (nockDone) => {
      s3.getJsonObjectCached("invalid.json").catch((err) => {
        expect(err.message).to.equal("Unexpected token \u001f in JSON at position 0");
        nockDone();
        done();
      });
    });
  });

  it("Testing JSON", (done) => {
    nockBack(`large.json_recording.json`, {}, (nockDone) => {
      s3.getJsonObjectCached("large.json").then((json) => {
        expect(json[0].tags).to.include("anim");
        expect(json[1].friends[2].name).to.equal("Susanne Alvarez");
        nockDone();
        done();
      });
    });
  });

  it("Testing GZIP", (done) => {
    nockBack(`large.json.gz_recording.json`, {}, (nockDone) => {
      // Important: There is currently a bug in Nock, which requires us to add gzip content type
      // manually into  the recorded files. Reference: https://github.com/node-nock/nock/issues/1001
      s3.getDeflatedObjectCached("large.json.gz").then((r) => {
        const json = JSON.parse(r);
        expect(json[0].tags).to.include("anim");
        expect(json[1].friends[2].name).to.equal("Susanne Alvarez");
        nockDone();
        done();
      });
    });
  });
});