import type { Locale } from "./i18n/config";

/**
 * Short sleep stories, read by the phone's voice on request. Slow, plain and uneventful on purpose:
 * nothing to solve, nothing to fear, an ending that just gets quieter. Same ids and paragraph count
 * in every language (test/stories.test.ts).
 */
export type StoryId = "lighthouse" | "night-train" | "tea-hills";

export interface Story {
  id: StoryId;
  title: string;
  summary: string;
  minutes: number;
  paragraphs: string[];
}

const en: Story[] = [
  {
    id: "lighthouse",
    title: "The lighthouse keeper's cat",
    summary: "A grey cat, a warm lamp, and the sea saying the same soft thing all night.",
    minutes: 4,
    paragraphs: [
      "On a small island at the edge of the map there is a lighthouse, and in the lighthouse there lives a grey cat named Moss.",
      "Every evening, when the sky turns the colour of weak tea, the keeper climbs the spiral stairs and lights the great lamp. Moss follows, one slow step at a time, and settles on the warm stone by the window.",
      "Outside, the sea breathes in and breathes out. It comes up the beach, and it goes back down. It has been doing this since long before the lighthouse, and it is in no hurry at all.",
      "The lamp turns, and its long gold arm sweeps across the water. Once around. Once around again. Moss watches the light pass over the waves, and her eyes grow heavy.",
      "Somewhere far out, a fishing boat sees the light and knows the way home. There is nothing for Moss to do about it. The light does its work by itself.",
      "The keeper makes a cup of something warm and sits in the old chair. The kettle ticks as it cools. The wind hums a low note around the tower, the same note it always hums.",
      "Moss tucks her paws under her chest. The stone is warm, the light keeps turning, and the sea keeps breathing, in and out, in and out, slower now.",
      "Nothing needs to happen tonight. The light will keep watch. Moss closes her eyes, and so can you.",
    ],
  },
  {
    id: "night-train",
    title: "The slow night train",
    summary: "A sleeper carriage, a blanket, and small towns passing by in the dark.",
    minutes: 4,
    paragraphs: [
      "There is a train that only runs at night. It is not a fast train. It takes the long way, through valleys and past sleeping towns, and nobody on board is in a rush.",
      "Your carriage has a narrow bed with a heavy wool blanket, a small lamp, and a window with the blind half down. The train sways gently, side to side, like a hammock.",
      "Outside, a station drifts by. One yellow light, an empty bench, a clock that nobody is looking at. Then it is gone, and there is only the dark again.",
      "The wheels make their quiet rhythm on the rails. Tadum, tadum. Tadum, tadum. You do not have to count it. It counts itself.",
      "Somewhere down the corridor, a door closes softly. Someone says goodnight in a low voice. The lamp in your carriage glows like a small moon.",
      "You pull the blanket up to your chin. Whatever was waiting for you today will still be there in the morning, and it can wait. Tonight you are only travelling.",
      "The train crosses a long bridge over a wide, dark river. For a moment the sound changes, deeper and hollow, and then the rhythm comes back, steady as a heartbeat.",
      "Tadum, tadum. The town lights are far behind now. The train knows the way. All you have to do is rest.",
    ],
  },
  {
    id: "tea-hills",
    title: "Rain on the tea hills",
    summary: "An evening on a hillside tea farm while a soft rain comes and goes.",
    minutes: 4,
    paragraphs: [
      "High in the hills, the tea bushes grow in long green rows that curve around the slopes like the lines of a fingerprint.",
      "In the evening, the workers have gone home. Their baskets are stacked by the door of a small wooden house, and a lamp is lit inside.",
      "Then the rain comes. Not a storm, just a soft rain, the kind that whispers. It falls on the tea leaves, on the tin roof, on the path, all at once and very gently.",
      "Inside the house, a pot of water heats over a low flame. The window fogs a little at the edges. The smell of wet earth and green leaves drifts in through the cracks.",
      "Down the hill, a stream fills up and talks to itself over the stones. A frog says something once and then decides it was not important.",
      "The rain grows lighter, then heavier, then lighter again, like someone breathing in their sleep. There is no need to listen closely. It will keep going on its own.",
      "The lamp is turned down. The blanket is thick and smells faintly of sun. The tea hills are dark now, and every leaf is holding a small drop of rain.",
      "Rest here a while. The rain will look after the hills tonight, and the morning will come slowly, when it is ready.",
    ],
  },
];

const vi: Story[] = [
  {
    id: "lighthouse",
    title: "Con mèo của người gác hải đăng",
    summary: "Một chú mèo xám, ngọn đèn ấm, và biển cả thì thầm mãi một điều suốt đêm.",
    minutes: 4,
    paragraphs: [
      "Trên một hòn đảo nhỏ ở mép tấm bản đồ có một ngọn hải đăng, và trong ngọn hải đăng ấy có một chú mèo xám tên là Rêu.",
      "Mỗi tối, khi bầu trời ngả màu trà loãng, người gác đèn leo cầu thang xoắn ốc lên thắp ngọn đèn lớn. Rêu đi theo sau, từng bậc một thật chậm, rồi nằm cuộn trên bậu đá ấm cạnh cửa sổ.",
      "Bên ngoài, biển hít vào rồi thở ra. Sóng lên bờ cát, rồi lại rút xuống. Biển đã làm vậy từ rất lâu trước khi có ngọn hải đăng, và chẳng vội vàng gì cả.",
      "Ngọn đèn xoay, cánh tay ánh vàng dài quét qua mặt nước. Một vòng. Rồi lại một vòng. Rêu nhìn ánh sáng trôi qua những con sóng, mắt cứ nặng dần.",
      "Đâu đó ngoài xa, một chiếc thuyền đánh cá nhìn thấy ánh đèn và biết đường về. Rêu chẳng cần làm gì cả. Ngọn đèn tự làm việc của nó.",
      "Người gác đèn pha một cốc gì đó ấm nóng rồi ngồi xuống chiếc ghế cũ. Ấm nước kêu lách tách khi nguội dần. Gió ngân một nốt trầm quanh ngọn tháp, vẫn cái nốt mà đêm nào nó cũng ngân.",
      "Rêu thu chân vào dưới ngực. Bậu đá ấm, ngọn đèn vẫn xoay, biển vẫn thở, vào rồi ra, vào rồi ra, chậm hơn rồi.",
      "Đêm nay không cần điều gì xảy ra cả. Ngọn đèn sẽ canh giữ. Rêu nhắm mắt lại, và bạn cũng có thể nhắm mắt.",
    ],
  },
  {
    id: "night-train",
    title: "Chuyến tàu đêm chậm rãi",
    summary: "Một toa giường nằm, tấm chăn dày, và những thị trấn nhỏ trôi qua trong bóng tối.",
    minutes: 4,
    paragraphs: [
      "Có một chuyến tàu chỉ chạy vào ban đêm. Nó không phải tàu nhanh. Nó đi đường vòng, qua những thung lũng và những thị trấn đang ngủ, và chẳng ai trên tàu vội vã cả.",
      "Toa của bạn có một chiếc giường hẹp với tấm chăn len dày, một ngọn đèn nhỏ, và ô cửa sổ kéo rèm xuống một nửa. Con tàu lắc lư nhè nhẹ, sang trái rồi sang phải, như một chiếc võng.",
      "Bên ngoài, một nhà ga trôi qua. Một ngọn đèn vàng, một băng ghế trống, một chiếc đồng hồ chẳng ai nhìn. Rồi nó khuất, chỉ còn lại bóng tối.",
      "Bánh xe gõ nhịp khẽ khàng trên đường ray. Tạch tạch, tạch tạch. Tạch tạch, tạch tạch. Bạn không cần đếm. Nhịp ấy tự đếm lấy.",
      "Đâu đó cuối hành lang, một cánh cửa khẽ khép lại. Có ai đó nói lời chúc ngủ ngon thật nhỏ. Ngọn đèn trong toa bạn sáng dịu như một vầng trăng con.",
      "Bạn kéo chăn lên tận cằm. Những gì đang chờ bạn hôm nay vẫn sẽ ở đó vào buổi sáng, và chúng có thể đợi. Đêm nay bạn chỉ đang đi thôi.",
      "Con tàu băng qua một cây cầu dài bắc trên dòng sông rộng và tối. Trong chốc lát, âm thanh đổi khác, trầm và vang hơn, rồi nhịp quen thuộc trở lại, đều như nhịp tim.",
      "Tạch tạch, tạch tạch. Ánh đèn thị trấn đã ở rất xa phía sau. Con tàu biết đường. Bạn chỉ cần nghỉ ngơi.",
    ],
  },
  {
    id: "tea-hills",
    title: "Mưa trên đồi chè",
    summary: "Một buổi tối trên đồi chè, khi cơn mưa nhỏ đến rồi đi.",
    minutes: 4,
    paragraphs: [
      "Trên những ngọn đồi cao, chè mọc thành từng hàng xanh dài, uốn quanh sườn đồi như những đường vân tay.",
      "Buổi tối, người hái chè đã về nhà cả. Những chiếc gùi xếp chồng bên cửa một ngôi nhà gỗ nhỏ, và bên trong, một ngọn đèn đã được thắp lên.",
      "Rồi mưa đến. Không phải giông bão, chỉ là một cơn mưa nhỏ, loại mưa thì thầm. Mưa rơi trên lá chè, trên mái tôn, trên lối đi, cùng một lúc và thật khẽ.",
      "Trong nhà, một nồi nước đang ấm dần trên bếp lửa nhỏ. Ô cửa sổ mờ hơi nước ở các góc. Mùi đất ướt và mùi lá xanh len vào qua khe cửa.",
      "Dưới chân đồi, con suối đầy nước, róc rách nói chuyện một mình trên những hòn đá. Một chú ếch kêu lên một tiếng, rồi hình như thấy cũng chẳng có gì quan trọng.",
      "Mưa nhẹ đi, rồi nặng hạt hơn, rồi lại nhẹ đi, như ai đó đang thở trong giấc ngủ. Không cần lắng nghe kỹ đâu. Mưa sẽ tự rơi tiếp.",
      "Ngọn đèn được vặn nhỏ lại. Tấm chăn dày, còn thoang thoảng mùi nắng. Đồi chè giờ đã tối, và chiếc lá nào cũng đang giữ một giọt mưa nhỏ.",
      "Hãy nghỉ ở đây một lúc. Đêm nay mưa sẽ chăm sóc những ngọn đồi, và buổi sáng sẽ đến thật chậm, khi nó sẵn sàng.",
    ],
  },
];

const id: Story[] = [
  {
    id: "lighthouse",
    title: "Kucing penjaga mercusuar",
    summary: "Seekor kucing abu-abu, lampu yang hangat, dan laut yang membisikkan hal yang sama sepanjang malam.",
    minutes: 4,
    paragraphs: [
      "Di sebuah pulau kecil di ujung peta ada sebuah mercusuar, dan di mercusuar itu tinggal seekor kucing abu-abu bernama Lumut.",
      "Setiap sore, saat langit berubah warna seperti teh encer, penjaga mercusuar menaiki tangga melingkar dan menyalakan lampu besar. Lumut mengikuti dari belakang, satu anak tangga demi satu, pelan sekali, lalu meringkuk di atas batu hangat dekat jendela.",
      "Di luar, laut menarik napas dan mengembuskannya. Ombak naik ke pantai, lalu turun lagi. Laut sudah begitu sejak lama sebelum mercusuar itu ada, dan ia sama sekali tidak terburu-buru.",
      "Lampu itu berputar, dan lengan cahayanya yang panjang dan keemasan menyapu permukaan air. Satu putaran. Satu putaran lagi. Lumut memandangi cahaya yang lewat di atas ombak, dan matanya mulai berat.",
      "Jauh di tengah laut, sebuah perahu nelayan melihat cahaya itu dan tahu jalan pulang. Lumut tidak perlu melakukan apa-apa. Cahaya itu bekerja dengan sendirinya.",
      "Penjaga mercusuar membuat secangkir minuman hangat dan duduk di kursi tuanya. Ketel berdetik pelan saat mendingin. Angin bersenandung rendah di sekeliling menara, nada yang sama yang selalu ia senandungkan.",
      "Lumut menyelipkan kakinya di bawah dada. Batunya hangat, cahayanya terus berputar, dan laut terus bernapas, masuk dan keluar, masuk dan keluar, makin pelan sekarang.",
      "Tidak ada yang perlu terjadi malam ini. Cahaya itu akan berjaga. Lumut memejamkan mata, dan kamu juga boleh.",
    ],
  },
  {
    id: "night-train",
    title: "Kereta malam yang pelan",
    summary: "Gerbong tidur, selimut tebal, dan kota-kota kecil yang lewat dalam gelap.",
    minutes: 4,
    paragraphs: [
      "Ada sebuah kereta yang hanya berjalan di malam hari. Kereta itu tidak cepat. Ia mengambil jalan memutar, melewati lembah dan kota-kota yang sedang tidur, dan tidak ada penumpang yang terburu-buru.",
      "Gerbongmu punya ranjang sempit dengan selimut wol yang tebal, sebuah lampu kecil, dan jendela dengan tirai yang setengah tertutup. Kereta bergoyang pelan, ke kiri dan ke kanan, seperti ayunan.",
      "Di luar, sebuah stasiun lewat perlahan. Satu lampu kuning, satu bangku kosong, satu jam dinding yang tidak dilihat siapa pun. Lalu stasiun itu hilang, dan yang ada hanya gelap lagi.",
      "Roda-roda berbunyi dengan irama yang tenang di atas rel. Tak-tuk, tak-tuk. Tak-tuk, tak-tuk. Kamu tidak perlu menghitungnya. Irama itu menghitung dirinya sendiri.",
      "Di ujung lorong, sebuah pintu tertutup pelan. Seseorang mengucapkan selamat tidur dengan suara rendah. Lampu di gerbongmu bersinar seperti bulan kecil.",
      "Kamu menarik selimut sampai ke dagu. Apa pun yang menunggumu hari ini akan tetap ada besok pagi, dan semua itu bisa menunggu. Malam ini kamu hanya sedang berjalan.",
      "Kereta melintasi jembatan panjang di atas sungai yang lebar dan gelap. Sebentar suaranya berubah, lebih dalam dan bergema, lalu iramanya kembali, tenang seperti detak jantung.",
      "Tak-tuk, tak-tuk. Lampu-lampu kota sudah jauh di belakang. Kereta ini tahu jalannya. Yang perlu kamu lakukan hanya beristirahat.",
    ],
  },
  {
    id: "tea-hills",
    title: "Hujan di bukit teh",
    summary: "Sore di kebun teh di lereng bukit, saat hujan lembut datang dan pergi.",
    minutes: 4,
    paragraphs: [
      "Tinggi di perbukitan, tanaman teh tumbuh dalam barisan hijau yang panjang, melengkung mengikuti lereng seperti garis-garis sidik jari.",
      "Sore hari, para pemetik teh sudah pulang. Keranjang mereka ditumpuk di dekat pintu sebuah rumah kayu kecil, dan di dalamnya sebuah lampu sudah dinyalakan.",
      "Lalu hujan datang. Bukan badai, hanya hujan lembut, jenis hujan yang berbisik. Hujan jatuh di daun teh, di atap seng, di jalan setapak, semuanya bersamaan dan pelan sekali.",
      "Di dalam rumah, sepanci air menghangat di atas api kecil. Kaca jendela sedikit berembun di pinggirnya. Bau tanah basah dan daun hijau masuk lewat celah-celah.",
      "Di kaki bukit, sebuah sungai kecil mulai penuh dan bercakap sendiri di antara batu-batu. Seekor katak bersuara sekali, lalu sepertinya memutuskan itu tidak terlalu penting.",
      "Hujan makin reda, lalu makin deras, lalu reda lagi, seperti seseorang yang bernapas dalam tidurnya. Tidak perlu mendengarkan baik-baik. Hujan akan terus turun dengan sendirinya.",
      "Lampu dikecilkan. Selimutnya tebal dan samar-samar berbau matahari. Bukit teh sekarang sudah gelap, dan setiap helai daun sedang memegang setetes kecil air hujan.",
      "Istirahatlah di sini sebentar. Malam ini hujan yang akan menjaga bukit-bukit itu, dan pagi akan datang pelan-pelan, saat ia sudah siap.",
    ],
  },
];

export const STORIES: Record<Locale, Story[]> = { en, vi, id };

export const getStory = (locale: Locale, id: string) => STORIES[locale].find((s) => s.id === id) ?? null;
