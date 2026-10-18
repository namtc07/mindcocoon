import { dayKey } from "./dates";
import type { Locale } from "./i18n/config";

/**
 * Gentle reflection prompts — written to invite, never to demand.
 * Index i in `vi` translates index i in `en`; keep both lists in step.
 */
export const REFLECTION_PROMPTS: Record<Locale, string[]> = {
  en: [
    "What is one thing you are carrying today that isn't yours to carry?",
    "Where in your body do you feel today the most?",
    "What would you say to a friend who felt the way you feel right now?",
    "What did you need this week that you didn't get?",
    "Name one small thing that felt okay today.",
    "What are you pretending not to know?",
    "If today had a weather, what would it be?",
    "What is something you miss, and what did it give you?",
    "Which conversation keeps replaying in your head?",
    "What would rest look like for you tonight, honestly?",
    "What are you proud of that nobody noticed?",
    "What boundary did you wish you had kept today?",
    "Write the sentence you are afraid to say out loud.",
    "What is changing in your life, even slowly?",
    "Who do you feel safest around, and why?",
    "What would you let go of if you knew you'd be okay?",
    "What part of today would you like to forget? What part would you keep?",
    "What does your tiredness want you to know?",
    "Describe a place where you once felt completely calm.",
    "What expectation are you holding yourself to that feels too heavy?",
    "What is one kind thing you can do for yourself in the next hour?",
    "What are you grieving, even if it seems small?",
    "When did you last laugh without trying?",
    "What would you write in a letter you never have to send?",
    "What does 'enough' look like today?",
    "What are you looking forward to, even a little?",
    "Which thought keeps visiting you uninvited?",
    "What did your younger self need to hear?",
    "What are you learning about yourself lately?",
    "If your worry could speak, what would it ask for?",
    "Which exam or deadline is taking up the most room in your head?",
    "What do you wish your parents understood about you right now?",
    "Is there a friendship that feels different lately? What changed?",
    "Whose expectations are you trying to live up to?",
    "What would you do this weekend if no one was grading you?",
  ],
  vi: [
    "Hôm nay bạn đang mang điều gì vốn không phải của bạn?",
    "Hôm nay bạn cảm nhận rõ nhất ở chỗ nào trên cơ thể?",
    "Bạn sẽ nói gì với một người bạn đang cảm thấy y như bạn lúc này?",
    "Tuần này bạn cần điều gì mà chưa có được?",
    "Kể một điều nhỏ hôm nay khiến bạn thấy ổn.",
    "Có điều gì bạn đang giả vờ như không biết?",
    "Nếu hôm nay là một kiểu thời tiết, đó sẽ là gì?",
    "Bạn đang nhớ điều gì, và nó từng cho bạn điều gì?",
    "Cuộc trò chuyện nào cứ lặp lại mãi trong đầu bạn?",
    "Thành thật mà nói, tối nay nghỉ ngơi với bạn trông thế nào?",
    "Bạn tự hào về điều gì mà chẳng ai để ý?",
    "Hôm nay bạn ước mình đã giữ được ranh giới nào?",
    "Viết ra câu mà bạn sợ phải nói thành lời.",
    "Điều gì trong cuộc sống bạn đang thay đổi, dù rất chậm?",
    "Bạn thấy an toàn nhất khi ở cạnh ai, và vì sao?",
    "Bạn sẽ buông điều gì nếu biết rằng mình vẫn sẽ ổn?",
    "Phần nào của hôm nay bạn muốn quên? Phần nào bạn muốn giữ lại?",
    "Sự mệt mỏi của bạn đang muốn nói với bạn điều gì?",
    "Tả một nơi bạn từng thấy hoàn toàn bình yên.",
    "Bạn đang tự đặt cho mình kỳ vọng nào quá nặng?",
    "Một điều tử tế bạn có thể làm cho mình trong một giờ tới là gì?",
    "Bạn đang tiếc thương điều gì, dù nó có vẻ nhỏ bé?",
    "Lần cuối bạn cười mà không cần cố là khi nào?",
    "Bạn sẽ viết gì trong một lá thư không bao giờ phải gửi?",
    "Hôm nay, 'đủ rồi' trông như thế nào?",
    "Bạn đang mong chờ điều gì, dù chỉ một chút?",
    "Ý nghĩ nào cứ tìm đến bạn dù bạn không mời?",
    "Bạn của ngày bé đã cần được nghe điều gì?",
    "Dạo này bạn đang học được gì về chính mình?",
    "Nếu nỗi lo của bạn biết nói, nó sẽ xin điều gì?",
    "Kỳ thi hay hạn chót nào đang chiếm nhiều chỗ nhất trong đầu bạn?",
    "Lúc này bạn ước bố mẹ hiểu điều gì về bạn?",
    "Có tình bạn nào dạo này thấy khác đi không? Điều gì đã đổi?",
    "Bạn đang cố sống cho vừa với kỳ vọng của ai?",
    "Cuối tuần này bạn sẽ làm gì nếu không ai chấm điểm bạn?",
  ],
};

/** Stable prompt for a given day (same index in both languages). */
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
