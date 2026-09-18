import type { AssistantAnswer, ClassEntry } from "@/types";

/**
 * Frontend-only demo content used by previews and component tests.
 * Keep this data deterministic so the schedule and assistant copy are easy to
 * exercise without connecting to the canister.
 */
export const MOCK_CLASS_SCHEDULE: ClassEntry[] = [
  {
    id: 101n,
    subject: "การเขียนโปรแกรมเบื้องต้น",
    day: "จันทร์",
    startTime: "09:00",
    endTime: "11:00",
    buildingName: "อาคารวิทยาศาสตร์ 2",
    roomCode: "SC-310",
    instructor: "อ.ดร.ณัฐวุฒิ เก่งกิจ",
  },
  {
    id: 102n,
    subject: "สถิติสำหรับวิทยาศาสตร์",
    day: "จันทร์",
    startTime: "13:00",
    endTime: "15:00",
    buildingName: "อาคารเรียนรวม",
    roomCode: "EN-405",
    instructor: "ผศ.ดร.กนกพร มีสุข",
  },
  {
    id: 103n,
    subject: "การออกแบบนวัตกรรม",
    day: "อังคาร",
    startTime: "10:00",
    endTime: "12:00",
    buildingName: "อาคารนวัตกรรมการเรียนรู้",
    roomCode: "IN-201",
    instructor: "อ.ธนกฤต สร้างสรรค์",
  },
  {
    id: 104n,
    subject: "สุขภาพดิจิทัล",
    day: "พุธ",
    startTime: "14:00",
    endTime: "16:00",
    buildingName: "อาคารสาธารณสุข",
    roomCode: "PH-305",
    instructor: "อ.ดร.ลลิตา ใจดี",
  },
  {
    id: 105n,
    subject: "โครงงานวิทยาศาสตร์ข้อมูล",
    day: "พฤหัสบดี",
    startTime: "09:00",
    endTime: "12:00",
    buildingName: "อาคารวิทยาศาสตร์ 2",
    roomCode: "SC-415",
    instructor: "ผศ.ดร.ปรีชา วงศ์วิทย์",
  },
  {
    id: 106n,
    subject: "ปัญญาประดิษฐ์สำหรับชีวิตประจำวัน",
    day: "ศุกร์",
    startTime: "09:00",
    endTime: "11:00",
    buildingName: "อาคารเทคโนโลยีสารสนเทศ",
    roomCode: "IT-204",
    instructor: "อ.ดร.กมลวรรณ ฉลาดคิด",
  },
  {
    id: 107n,
    subject: "การสื่อสารและการนำเสนอ",
    day: "ศุกร์",
    startTime: "13:00",
    endTime: "15:00",
    buildingName: "อาคารเรียนรวม",
    roomCode: "EN-302",
    instructor: "อ.ภัทราวดี พูดเก่ง",
  },
];

export const MOCK_AI_RECOMMENDATIONS = [
  {
    title: "เตรียมตัวสำหรับคลาสถัดไป",
    message:
      "คลาสการเขียนโปรแกรมเบื้องต้นเริ่มเวลา 09:00 ที่ห้อง SC-310 แนะนำให้ออกเดินทางก่อนเวลา 15 นาที",
    question: "ช่วยวางแผนไปห้อง SC-310 ให้หน่อย",
  },
  {
    title: "ทบทวนบทเรียนระหว่างรอคลาส",
    message:
      "วันนี้มีเวลาว่างช่วง 11:00–13:00 ลองทบทวนเรื่องอัลกอริทึมที่ห้องสมุดชั้น 2 หรือถามฉันทำสรุปสั้น ๆ ได้เลย",
    question: "ช่วยสรุปอัลกอริทึมเบื้องต้นให้หน่อย",
  },
  {
    title: "อย่าลืมเช็กห้องเรียน",
    message:
      "พรุ่งนี้มีวิชาการออกแบบนวัตกรรมที่อาคารนวัตกรรมการเรียนรู้ ห้อง IN-201 ฉันช่วยวางเส้นทางล่วงหน้าให้ได้",
    question: "พรุ่งนี้ฉันต้องไปเรียนที่ไหนบ้าง",
  },
  {
    title: "เตรียมพร้อมสำหรับคลาสวันศุกร์",
    message:
      "วันศุกร์มีคลาสปัญญาประดิษฐ์สำหรับชีวิตประจำวันเวลา 09:00 ที่ห้อง IT-204 แนะนำให้อ่านหัวข้อเบื้องต้นและออกเดินทางก่อนเวลา 15 นาที",
    question: "ช่วยเตรียมตัวสำหรับคลาส AI วันศุกร์ให้หน่อย",
  },
  {
    title: "วางแผนช่วงพักวันศุกร์",
    message:
      "หลังคลาสช่วงเช้าวันศุกร์จะมีเวลาว่าง 11:00–13:00 ก่อนคลาสการสื่อสารและการนำเสนอที่ห้อง EN-302 ลองพักรับประทานอาหารและทบทวนสไลด์ได้เลย",
    question: "ช่วยวางแผนช่วงพักก่อนคลาสวันศุกร์ให้หน่อย",
  },
] satisfies Array<{
  title: string;
  message: string;
  question: string;
}>;

export const MOCK_AI_ANSWERS: AssistantAnswer[] = [
  {
    intent: "schedule",
    answer:
      "ตารางเรียนอัปเดตแล้วครับ วันนี้มีการเขียนโปรแกรมเบื้องต้น 09:00–11:00 ที่ห้อง SC-310 และสถิติสำหรับวิทยาศาสตร์ 13:00–15:00 ที่ห้อง EN-405",
  },
  {
    intent: "recommendation",
    answer:
      "แนะนำให้เตรียมตัวสำหรับคลาสถัดไปและออกจากจุดปัจจุบันก่อนเวลาเริ่มประมาณ 15 นาที เพื่อไปถึงห้อง SC-310 อย่างสบาย ๆ ครับ",
  },
];
