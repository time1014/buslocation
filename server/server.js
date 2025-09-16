import express from "express";
import axios from "axios";
import cors from "cors";
import fs from "fs";
import csv from "csv-parser";

const app = express();
app.use(cors());
const PORT = 5000;

// ✅ 대구 버스 API 키
const API_KEY = "pyQOwrIyUvIGywiiaHLjlWdFbv91ODcsA4eaXM%2B4wsn2Crk8%2FLtt8W07yQNdngzJK%2FO%2BMe0QEQlf%2FNtx%2FJaZ9A%3D%3D";

// ✅ CSV 정류장 데이터 로드
let stations = [];

fs.createReadStream("dstations.csv", { encoding: "utf8" })
  .pipe(csv({ mapHeaders: ({ header }) => header.replace(/^\uFEFF/, "") }))
  .on("data", (row) => {
    stations.push({
      bsId: row["정류소아이디"],
      mobileNo: row["모바일아이디"],
      stationName: row["정류소명"],
      lat: row["위도"],
      lng: row["경도"],
    });
  })
  .on("end", () => {
    console.log("✅ 정류장 데이터 로드 완료, 총 개수:", stations.length);
  });

// 정류장 이름으로 검색
app.get("/api/station/:name", (req, res) => {
  const { name } = req.params;
  const result = stations
    .filter((st) => st.stationName.includes(name))
    .map((st) => ({
      bsId: st.bsId,
      mobileNo: st.mobileNo,
      stationName: st.stationName,
      lat: st.lat,
      lng: st.lng,
    }));
  res.json(result);
});

// 특정 정류장(bsId) + 버스번호(routeNo) → 도착 정보
app.get("/api/arrival/:bsId/:routeNo", async (req, res) => {
  const { bsId, routeNo } = req.params;
  try {
    const url = `https://apis.data.go.kr/6270000/dbmsapi02/getRealtime02?serviceKey=${API_KEY}&bsId=${bsId}&routeNo=${routeNo}`;
    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    console.error("🚨 API 호출 에러:", error);
    res.status(500).json({ error: "버스 도착 정보 가져오기 실패" });
  }
});

// 🚍 특정 노선(routeId) → 실시간 위치
app.get("/api/positions/:routeId", async (req, res) => {
  const { routeId } = req.params;
  try {
    const url = `https://apis.data.go.kr/6270000/dbmsapi02/getPos02?serviceKey=${API_KEY}&routeId=${routeId}`;
    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    console.error("🚨 버스 위치 API 에러:", error);
    res.status(500).json({ error: "버스 위치 가져오기 실패" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});