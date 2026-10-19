import { dayKey } from "./dates";
import type { Locale } from "./i18n/config";

/**
 * Writing ideas: short, plain, everyday questions — what a friend might ask, never therapy-speak.
 * The Vietnamese is written natively, not translated. Index i in `vi` and `id` matches index i in `en`
 * (same theme, see PROMPT_THEME_OF); keep all lists in step.
 */
export const REFLECTION_PROMPTS: Record<Locale, string[]> = {
  en: [
    "What's weighing on you most today?",
    "How does your body feel right now?",
    "If a friend felt like you do now, what would you tell them?",
    "What did you need this week but didn't get?",
    "One small thing that went okay today?",
    "Is there something you've been trying not to think about?",
    "Describe today in three words.",
    "Who or what do you miss lately?",
    "Which conversation keeps playing in your head?",
    "What would help you really rest tonight?",
    "What did you do well today that nobody noticed?",
    "Was there a moment today you wish you'd said no?",
    "What haven't you said out loud yet?",
    "What's slowly getting better, even a little?",
    "Who do you feel most at ease with? Why?",
    "What would you drop if you knew things would be fine?",
    "Best and worst part of today?",
    "What's making you most tired lately?",
    "Describe a place where you feel calm.",
    "Are you asking too much of yourself somewhere?",
    "One kind thing you could do for yourself in the next hour?",
    "Is something making you sad, even if it seems small?",
    "When did you last really laugh?",
    "Write a message you'll never send.",
    "How much would be enough for today?",
    "What are you looking forward to, even a little?",
    "Which thought keeps coming back today?",
    "What do you wish someone would tell you right now?",
    "What have you noticed about yourself lately?",
    "What's the worry, in one sentence?",
    "Which exam or deadline is on your mind most?",
    "What do you wish your parents understood about you?",
    "Has a friendship felt different lately?",
    "Whose expectations are you trying to meet?",
    "What would you do this weekend if nothing was graded?",
  ],
  vi: [
    "Hôm nay điều gì làm bạn nặng lòng nhất?",
    "Người bạn lúc này thấy sao? Mỏi, căng, hay ổn?",
    "Nếu bạn thân đang thấy y như bạn bây giờ, bạn sẽ nói gì với nó?",
    "Tuần này bạn cần gì mà chưa có?",
    "Hôm nay có chuyện nhỏ nào ổn ổn không?",
    "Có chuyện gì bạn đang cố không nghĩ tới không?",
    "Tả hôm nay bằng ba từ.",
    "Dạo này bạn nhớ ai, hay nhớ điều gì?",
    "Có cuộc nói chuyện nào cứ lặp đi lặp lại trong đầu không?",
    "Tối nay làm gì thì bạn thấy được nghỉ thật sự?",
    "Hôm nay bạn làm tốt điều gì mà không ai để ý?",
    "Hôm nay có lúc nào bạn ước mình đã từ chối không?",
    "Có điều gì bạn chưa dám nói ra không?",
    "Có gì đang dần tốt lên, dù chỉ một chút?",
    "Ở cạnh ai bạn thấy thoải mái nhất? Vì sao?",
    "Nếu biết mọi thứ vẫn ổn, bạn muốn bỏ bớt việc gì?",
    "Hôm nay, lúc nào vui nhất và lúc nào tệ nhất?",
    "Dạo này điều gì làm bạn mệt nhất?",
    "Kể về một nơi khiến bạn thấy bình yên.",
    "Có việc gì bạn đang đòi hỏi bản thân quá sức không?",
    "Trong một tiếng tới, bạn có thể làm gì tử tế cho chính mình?",
    "Có chuyện gì làm bạn buồn, dù nhỏ thôi?",
    "Lần gần nhất bạn cười thật lòng là khi nào?",
    "Viết một tin nhắn bạn sẽ không bao giờ gửi.",
    "Hôm nay làm tới đâu là đủ?",
    "Có gì bạn đang mong chờ không, dù chỉ một chút?",
    "Hôm nay có suy nghĩ nào cứ quay lại mãi không?",
    "Lúc này bạn muốn được ai đó nói với mình câu gì?",
    "Dạo này bạn để ý thấy gì mới ở bản thân?",
    "Bạn đang lo chuyện gì? Viết gọn trong một câu.",
    "Bài thi hay hạn chót nào đang làm bạn nghĩ nhiều nhất?",
    "Bạn mong bố mẹ hiểu điều gì về mình?",
    "Dạo này có tình bạn nào thấy khang khác không?",
    "Bạn đang cố làm vừa lòng ai?",
    "Cuối tuần này, nếu không phải lo điểm số, bạn muốn làm gì?",
  ],
  id: [
    "Apa yang paling membebanimu hari ini?",
    "Gimana rasanya badanmu sekarang? Pegal, tegang, atau baik-baik saja?",
    "Kalau temanmu merasa seperti kamu sekarang, apa yang akan kamu bilang?",
    "Minggu ini kamu butuh apa yang belum kamu dapat?",
    "Ada satu hal kecil yang berjalan lumayan hari ini?",
    "Ada sesuatu yang sedang kamu coba untuk tidak pikirkan?",
    "Gambarkan hari ini dalam tiga kata.",
    "Akhir-akhir ini kamu kangen siapa, atau apa?",
    "Obrolan mana yang terus terulang di kepalamu?",
    "Apa yang bisa bikin kamu benar-benar istirahat malam ini?",
    "Apa yang kamu lakukan dengan baik hari ini, tapi tidak ada yang sadar?",
    "Ada saat hari ini kamu berharap tadi bilang tidak?",
    "Apa yang belum kamu ucapkan sampai sekarang?",
    "Apa yang pelan-pelan membaik, walau sedikit?",
    "Dengan siapa kamu paling merasa nyaman? Kenapa?",
    "Kalau tahu semuanya akan baik-baik saja, apa yang mau kamu lepas?",
    "Bagian terbaik dan terburuk hari ini?",
    "Akhir-akhir ini apa yang paling bikin kamu capek?",
    "Ceritakan satu tempat yang bikin kamu merasa tenang.",
    "Apa kamu sedang terlalu menuntut diri sendiri di suatu hal?",
    "Satu hal baik apa yang bisa kamu lakukan untuk dirimu dalam sejam ke depan?",
    "Ada yang bikin kamu sedih, walau kelihatannya kecil?",
    "Kapan terakhir kali kamu tertawa lepas?",
    "Tulis pesan yang tidak akan pernah kamu kirim.",
    "Hari ini, sejauh mana sudah cukup?",
    "Ada yang sedang kamu nantikan, walau sedikit?",
    "Pikiran apa yang terus kembali hari ini?",
    "Kalimat apa yang ingin kamu dengar dari seseorang sekarang?",
    "Akhir-akhir ini kamu menyadari apa tentang dirimu?",
    "Apa yang kamu khawatirkan? Tulis dalam satu kalimat.",
    "Ujian atau tenggat mana yang paling sering kamu pikirkan?",
    "Apa yang kamu harap orang tuamu pahami tentang dirimu?",
    "Ada pertemanan yang terasa berbeda akhir-akhir ini?",
    "Harapan siapa yang sedang kamu coba penuhi?",
    "Akhir pekan ini, kalau tidak ada yang dinilai, kamu mau ngapain?",
  ],
};

/** Stable prompt for a given day (same index in every language). */
export function promptForDay(date: Date, locale: Locale, offset = 0): string {
  const list = REFLECTION_PROMPTS[locale];
  let hash = 0;
  for (const ch of dayKey(date)) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return list[(hash + offset) % list.length];
}

export const PROMPT_COUNT = REFLECTION_PROMPTS.en.length;

/** The prompt at a fixed index (same meaning in every language); wraps around both ways. */
export function promptAt(locale: Locale, index: number): string {
  const list = REFLECTION_PROMPTS[locale];
  return list[((index % list.length) + list.length) % list.length];
}

export const PROMPT_THEMES = ["heavy", "relationships", "study-work", "kindness", "hope", "self"] as const;
export type PromptTheme = (typeof PROMPT_THEMES)[number];

/** One theme per prompt, by index (the same in every language). */
export const PROMPT_THEME_OF: PromptTheme[] = [
  "heavy", "self", "kindness", "heavy", "hope", "self", "self", "heavy", "relationships", "kindness",
  "hope", "relationships", "self", "hope", "relationships", "heavy", "self", "heavy", "kindness", "study-work",
  "kindness", "heavy", "hope", "relationships", "kindness", "hope", "self", "kindness", "self", "heavy",
  "study-work", "relationships", "relationships", "study-work", "study-work",
];
