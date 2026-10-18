import type { Locale } from "./i18n/config";

/**
 * Gentle guided practices for the evening. Same ids, steps and inputs in every language
 * (test/practices.test.ts). Nothing here measures, scores or counts the person.
 */

export type PracticeId = "grounding" | "body-scan" | "three-good-things" | "kind-letter";

export interface PracticeStep {
  text: string;
  /** Suggested time for this step; shown as a quiet countdown, never auto-advances. */
  seconds?: number;
  /** A place to write: one line, or a longer letter. */
  input?: "line" | "letter";
}

export interface Practice {
  id: PracticeId;
  title: string;
  summary: string;
  minutes: number;
  steps: PracticeStep[];
}

const en: Practice[] = [
  {
    id: "grounding",
    title: "5-4-3-2-1 grounding",
    summary: "Come back to the room through your senses.",
    minutes: 2,
    steps: [
      { text: "Stay however you are, sitting or lying down. There's no wrong way to do this." },
      { text: "Look around. Find five things you can see: a colour, a shape, a small light.", seconds: 20 },
      { text: "Notice four things you can feel: the blanket, your feet, the air on your skin.", seconds: 20 },
      { text: "Listen for three sounds, near or far away.", seconds: 20 },
      { text: "Find two things you can smell, or think of two smells you like.", seconds: 20 },
      { text: "Notice one thing you can taste, or take one slow sip of water.", seconds: 20 },
      { text: "You're here, right now. That's enough." },
    ],
  },
  {
    id: "body-scan",
    title: "Body scan",
    summary: "Loosen what you're holding, from your feet to your face.",
    minutes: 4,
    steps: [
      { text: "Get comfortable and let your eyes close if that feels okay." },
      { text: "Bring your attention to your feet. Let them feel heavy.", seconds: 30 },
      { text: "Move up to your legs. Let the muscles soften, one breath at a time.", seconds: 30 },
      { text: "Notice your belly rise and fall. No need to change anything.", seconds: 30 },
      { text: "Feel your chest. Let each breath be slow and easy.", seconds: 30 },
      { text: "Let your shoulders drop away from your ears.", seconds: 30 },
      { text: "Unclench your jaw. Soften your eyes and your forehead.", seconds: 30 },
      { text: "Stay here as long as you like. Your body carried a lot today." },
    ],
  },
  {
    id: "three-good-things",
    title: "Three good things",
    summary: "End the day on something small that went okay.",
    minutes: 3,
    steps: [
      { text: "Think back over today. Even a hard day has small moments that were okay." },
      { text: "One good thing, however small:", input: "line" },
      { text: "A second one:", input: "line" },
      { text: "And a third:", input: "line" },
      { text: "Hold these three for a moment. They happened too." },
    ],
  },
  {
    id: "kind-letter",
    title: "A kind letter to yourself",
    summary: "Write to yourself the way you'd write to a friend.",
    minutes: 5,
    steps: [
      { text: "Think of what's weighing on you tonight. You don't have to fix it." },
      { text: "Write to yourself as you would to a close friend who feels this way. Be gentle.", input: "letter" },
      { text: "Read it back slowly. You deserve this kindness too." },
    ],
  },
];

const vi: Practice[] = [
  {
    id: "grounding",
    title: "Neo lại 5-4-3-2-1",
    summary: "Trở về với căn phòng qua các giác quan.",
    minutes: 2,
    steps: [
      { text: "Cứ ngồi hay nằm như bạn đang thấy dễ chịu. Không có cách nào là sai cả." },
      { text: "Nhìn quanh. Tìm năm thứ bạn thấy được: một màu sắc, một hình dáng, một đốm sáng nhỏ.", seconds: 20 },
      { text: "Cảm nhận bốn thứ bạn chạm được: tấm chăn, bàn chân, làn không khí trên da.", seconds: 20 },
      { text: "Lắng nghe ba âm thanh, gần hay xa.", seconds: 20 },
      { text: "Tìm hai mùi bạn ngửi thấy, hoặc nghĩ về hai mùi bạn thích.", seconds: 20 },
      { text: "Để ý một vị trong miệng, hoặc nhấp một ngụm nước thật chậm.", seconds: 20 },
      { text: "Bạn đang ở đây, ngay lúc này. Vậy là đủ rồi." },
    ],
  },
  {
    id: "body-scan",
    title: "Thả lỏng cơ thể",
    summary: "Buông dần những căng thẳng, từ bàn chân lên khuôn mặt.",
    minutes: 4,
    steps: [
      { text: "Tìm tư thế thoải mái, nhắm mắt lại nếu bạn thấy ổn." },
      { text: "Để ý đến bàn chân. Để chúng nặng xuống.", seconds: 30 },
      { text: "Đi dần lên đôi chân. Để các cơ mềm ra theo từng hơi thở.", seconds: 30 },
      { text: "Cảm nhận bụng phồng lên, xẹp xuống. Không cần thay đổi gì.", seconds: 30 },
      { text: "Cảm nhận lồng ngực. Để mỗi hơi thở chậm và nhẹ.", seconds: 30 },
      { text: "Thả hai vai xuống, xa khỏi tai.", seconds: 30 },
      { text: "Thả lỏng hàm. Để mắt và trán dịu lại.", seconds: 30 },
      { text: "Ở lại đây bao lâu tùy bạn. Hôm nay cơ thể bạn đã gánh nhiều rồi." },
    ],
  },
  {
    id: "three-good-things",
    title: "Ba điều tốt",
    summary: "Khép lại ngày bằng một điều nhỏ đã ổn.",
    minutes: 3,
    steps: [
      { text: "Nhìn lại hôm nay. Ngày khó khăn đến mấy cũng có vài khoảnh khắc nhỏ còn ổn." },
      { text: "Một điều tốt, dù nhỏ thế nào:", input: "line" },
      { text: "Điều thứ hai:", input: "line" },
      { text: "Và điều thứ ba:", input: "line" },
      { text: "Giữ ba điều này lại một chút. Chúng cũng đã xảy ra." },
    ],
  },
  {
    id: "kind-letter",
    title: "Lá thư gửi chính mình",
    summary: "Viết cho mình như viết cho một người bạn.",
    minutes: 5,
    steps: [
      { text: "Nghĩ về điều đang đè nặng bạn tối nay. Bạn không cần phải giải quyết nó." },
      { text: "Viết cho mình như viết cho một người bạn thân đang cảm thấy như vậy. Hãy thật dịu dàng.", input: "letter" },
      { text: "Đọc lại thật chậm. Bạn cũng xứng đáng được đối xử tử tế như thế." },
    ],
  },
];

const PRACTICES: Record<Locale, Practice[]> = { en, vi };

export function getPractices(locale: Locale): Practice[] {
  return PRACTICES[locale];
}

export function getPractice(locale: Locale, id: string): Practice | undefined {
  return PRACTICES[locale].find((p) => p.id === id);
}
