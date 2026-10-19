import type { Locale } from "./i18n/config";

/**
 * Gentle guided practices for the evening. Same ids, steps and inputs in every language
 * (test/practices.test.ts). Nothing here measures, scores or counts the person.
 */

export type PracticeId =
  | "grounding"
  | "body-scan"
  | "three-good-things"
  | "kind-letter"
  | "unsent-letter"
  | "safe-place"
  | "muscle-release"
  | "self-compassion"
  | "brain-dump";

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
  {
    id: "unsent-letter",
    title: "An unsent letter",
    summary: "Say what you never got to say, to someone, without sending it.",
    minutes: 5,
    steps: [
      { text: "Think of someone you have words for: someone you miss, someone who hurt you, someone you love." },
      { text: "Write to them. Say it the way you wish you could. Nobody else will read it.", input: "letter" },
      { text: "You don't have to send it. Saying it is already something." },
    ],
  },
  {
    id: "safe-place",
    title: "A safe place",
    summary: "Picture somewhere you feel completely at ease.",
    minutes: 3,
    steps: [
      { text: "Close your eyes if that feels okay. Think of a place, real or imagined, where you feel safe." },
      { text: "Look around it. What colours and light are there?", seconds: 30 },
      { text: "Listen. What sounds belong to this place?", seconds: 30 },
      { text: "Notice the air, the temperature, what's under your feet or your hands.", seconds: 30 },
      { text: "Let your shoulders settle. Nothing here asks anything of you.", seconds: 30 },
      { text: "This place is yours. You can come back to it any time." },
    ],
  },
  {
    id: "muscle-release",
    title: "Tense and release",
    summary: "Squeeze, then let go, one part of the body at a time.",
    minutes: 4,
    steps: [
      { text: "For each step, tighten gently for a few breaths, then let it all go. Never to the point of pain." },
      { text: "Curl your toes and tighten your feet. Hold… then release.", seconds: 20 },
      { text: "Tighten your legs. Hold… then let them go heavy.", seconds: 20 },
      { text: "Make fists with both hands. Hold… then open them slowly.", seconds: 20 },
      { text: "Lift your shoulders toward your ears. Hold… then drop them.", seconds: 20 },
      { text: "Scrunch your face. Hold… then let it soften completely.", seconds: 20 },
      { text: "Notice the difference between holding and letting go. You can always come back to it." },
    ],
  },
  {
    id: "self-compassion",
    title: "A kind pause",
    summary: "Three quiet sentences for a hard moment.",
    minutes: 2,
    steps: [
      { text: "Put a hand on your chest, or anywhere that feels comforting. Feel its warmth." },
      { text: "Say to yourself, quietly: this is a hard moment. It's okay to notice that it hurts.", seconds: 20 },
      { text: "Remind yourself: other people feel like this too. You're not the only one, and you're not doing it wrong.", seconds: 20 },
      { text: "Ask: what would I say to someone I love who felt this way? Say that to yourself now.", seconds: 30 },
      { text: "Take one slow breath. You can come back to this pause any time." },
    ],
  },
  {
    id: "brain-dump",
    title: "Empty your head",
    summary: "Write down everything that's buzzing, so your mind can stop holding it.",
    minutes: 3,
    steps: [
      { text: "Your mind doesn't have to remember everything tonight. Let's put it somewhere else for a while." },
      { text: "Write down everything that's on your mind, in any order. Tasks, worries, half-thoughts. Don't tidy it.", input: "letter" },
      { text: "Look at the list. Is there one small thing you could do tomorrow? Write just that one.", input: "line" },
      { text: "Everything else can wait. It's written down now, so you don't have to carry it to bed." },
    ],
  },
];

const vi: Practice[] = [
  {
    id: "grounding",
    title: "Về với hiện tại 5-4-3-2-1",
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
  {
    id: "unsent-letter",
    title: "Lá thư chưa gửi",
    summary: "Nói điều bạn chưa từng nói được với một người, mà không cần gửi đi.",
    minutes: 5,
    steps: [
      { text: "Nghĩ về một người bạn còn điều muốn nói: người bạn nhớ, người làm bạn tổn thương, người bạn thương." },
      { text: "Viết cho người ấy. Nói theo cách bạn ước mình đã nói. Không ai khác đọc được.", input: "letter" },
      { text: "Bạn không cần gửi đi. Nói ra được đã là một điều rồi." },
    ],
  },
  {
    id: "safe-place",
    title: "Một nơi bình yên",
    summary: "Hình dung một nơi bạn thấy hoàn toàn thoải mái.",
    minutes: 3,
    steps: [
      { text: "Nhắm mắt lại nếu bạn thấy ổn. Nghĩ về một nơi, có thật hay tưởng tượng, nơi bạn thấy an toàn." },
      { text: "Nhìn quanh nơi đó. Có những màu sắc và ánh sáng nào?", seconds: 30 },
      { text: "Lắng nghe. Nơi đó có những âm thanh gì?", seconds: 30 },
      { text: "Cảm nhận không khí, nhiệt độ, thứ đang ở dưới chân hay trong tay bạn.", seconds: 30 },
      { text: "Để vai thả lỏng. Ở đây không có gì đòi hỏi bạn cả.", seconds: 30 },
      { text: "Nơi này là của bạn. Bạn có thể quay lại bất cứ lúc nào." },
    ],
  },
  {
    id: "muscle-release",
    title: "Gồng rồi thả",
    summary: "Siết nhẹ rồi buông, từng phần cơ thể một.",
    minutes: 4,
    steps: [
      { text: "Ở mỗi bước, siết nhẹ trong vài hơi thở rồi buông hết ra. Đừng siết tới mức đau." },
      { text: "Co các ngón chân, siết bàn chân. Giữ… rồi thả ra.", seconds: 20 },
      { text: "Siết hai chân. Giữ… rồi để chúng nặng xuống.", seconds: 20 },
      { text: "Nắm chặt hai bàn tay. Giữ… rồi từ từ mở ra.", seconds: 20 },
      { text: "Nhún vai lên sát tai. Giữ… rồi thả xuống.", seconds: 20 },
      { text: "Nhăn cả khuôn mặt. Giữ… rồi để nó dịu hẳn lại.", seconds: 20 },
      { text: "Để ý sự khác nhau giữa lúc gồng và lúc buông. Bạn có thể quay lại cảm giác này bất cứ lúc nào." },
    ],
  },
  {
    id: "self-compassion",
    title: "Một khoảng lặng tử tế",
    summary: "Ba câu nói khẽ cho một lúc khó khăn.",
    minutes: 2,
    steps: [
      { text: "Đặt một bàn tay lên ngực, hoặc bất cứ chỗ nào khiến bạn thấy được vỗ về. Cảm nhận hơi ấm của nó." },
      { text: "Nói khẽ với mình: đây là một lúc khó khăn. Thấy đau cũng không sao cả.", seconds: 20 },
      { text: "Nhắc mình rằng: người khác cũng có lúc thấy như vậy. Bạn không phải người duy nhất, và bạn không làm sai gì cả.", seconds: 20 },
      { text: "Tự hỏi: mình sẽ nói gì với một người mình thương nếu họ đang thấy thế này? Giờ hãy nói câu đó với chính mình.", seconds: 30 },
      { text: "Thở một hơi thật chậm. Bạn có thể quay lại khoảng lặng này bất cứ lúc nào." },
    ],
  },
  {
    id: "brain-dump",
    title: "Đổ hết ra khỏi đầu",
    summary: "Viết ra mọi thứ đang lùng bùng, để đầu óc không phải ôm nữa.",
    minutes: 3,
    steps: [
      { text: "Tối nay đầu óc bạn không cần nhớ hết mọi thứ. Mình đặt chúng ở chỗ khác một lúc nhé." },
      { text: "Viết ra mọi thứ đang trong đầu, không cần theo thứ tự. Việc cần làm, nỗi lo, những ý nghĩ dở dang. Không cần gọn gàng.", input: "letter" },
      { text: "Nhìn lại danh sách. Có một việc nhỏ nào mai bạn làm được không? Chỉ viết đúng một việc đó thôi.", input: "line" },
      { text: "Mọi thứ khác có thể đợi. Chúng đã được viết ra rồi, nên bạn không phải mang chúng lên giường nữa." },
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
