import mongoose from 'mongoose';

// Predefined default section content for known product landing pages
export const DEFAULT_CONTENTS = {
  milkimom: {
    productSlug: 'milkimom',
    productName: 'মিল্কিমম',
    productNameEn: 'Milkimom',
    logoType: 'image',
    logoImage: '/images/logo.webp',
    announcementText: '⚡ আজই অর্ডার করলে মিল্কিমম ১০০% গ্যারান্টি সহ ডেলিভারি এবং ফ্রি ডেলিভারি অফার প্রজোয্য!',
    heroBadge: '১০০% প্রাকৃতিক উপাদান ও পার্শ্বপ্রতিক্রিয়ামুক্ত',
    heroTitle: 'মা ও শিশু, উভয়ের সুস্বাস্থ্যের জন্য প্রয়োজনীয় পুষ্টি নিশ্চিত করতে আমরা নিয়ে এসেছি মিল্কিমম™!',
    heroTitleHighlight: 'মিল্কিমম™',
    heroSubtitle: 'শিশুকে নিয়মিত দুধ খাওয়াচ্ছেন কিন্তু প্রয়োজনীয় দুধ পাচ্ছেন না, শিশুর কান্না থামছে না কিংবা ডাক্তারের কাছে ছুটতে হচ্ছে? দুশ্চিন্তার অবসান ঘটিয়ে শিশুর পুষ্টি ও মায়ের সুস্বাস্থ্য নিশ্চিতে নিয়ে নিন',
    heroSubtitleHighlight: 'শিশুর কান্না থামছে না কিংবা ডাক্তারের কাছে ছুটতে হচ্ছে',
    heroCtaText: 'অর্ডার করতে নিচে ক্লিক করুন',
    heroImage: '/images/product-jar.webp',
    doctorTitle: 'ডাক্তারের পরামর্শ ও সুপারিশকৃত',
    doctorName: 'ডা. ফারহানা শারমিন',
    doctorDegree: 'এমবিবিএস, এফসিপিএস',
    doctorQuote: 'মায়ের বুকের দুধ নবজাতকের জন্য সর্বোত্তম পুষ্টি। মিল্কিমম সম্পূর্ণ প্রাকৃতিক উপাদানে তৈরি যা নিরাপদভাবে দুধ উৎপাদনে কার্যকর সাহায্য করে।',
    doctorImage: '/assets/doctor/doctor.png',
    orderHeadline: 'আজই অর্ডার করুন মিল্কিমম™',
    orderSubheadline: 'নিচে আপনার তথ্য দিয়ে অর্ডার সম্পন্ন করুন',
    guaranteeTitle: '১০০% স্যাটিসফ্যাকশন ও মানি-ব্যাক গ্যারান্টি',
    guaranteeText: 'পণ্য হাতে পেয়ে পুরোপুরি সন্তুষ্ট না হলে বা কোনো সমস্যা থাকলে আমাদের সাপোর্ট টিমের সাথে সাথে যোগাযোগ করুন।',
    footerText: 'মিল্কিমম™ - মা ও শিশুর সুস্থতায় প্রতিদিনের নির্ভরযোগ্য প্রাকৃতিক সমাধান।',
    footerPhone: '01517-102603',
    footerEmail: 'milkimominfo@gmail.com',
    footerAddress: '202-J, Road-6, Mohammadiya Housing society, Mohammadpur, Dhaka.',
    howItWorksBadge: 'কি কাজ করে?',
    howItWorksTitle: 'একটি ডোজে ৫টি উপকারিতা',
    howItWorksSubtitle: 'প্রকৃতি ও বিজ্ঞানের সমন্বয়ে তৈরি মিল্কিমম মা ও শিশু উভয়ের জন্যই সামগ্রিক উপকার নিয়ে আসে।',
    howItWorksImage: '',
    benefitsItems: [
      { id: '1', accent: 'বুকের দুধ', rest: 'স্থায়ীভাবে বাড়ায়', sortOrder: 1 },
      { id: '2', accent: 'বন্ধ হয়ে যাওয়া', rest: 'বুকের দুধ পুনরায় তৈরি করে', sortOrder: 2 },
      { id: '3', accent: 'বুকের দুধের', rest: 'সব পুষ্টিগুণ বজায় রাখে', sortOrder: 3 },
      { id: '4', accent: 'বুকের দুধ', rest: 'পাতলা হলে ঘন করে', sortOrder: 4 },
      { id: '5', accent: 'ফর্মুলা দুধের', rest: 'খরচ বাঁচায়', sortOrder: 5 },
    ],
    carouselItems: [
      {
        id: '1',
        title: 'মা ও শিশুর যত্নে একটুও ছাড় নয়!',
        description: 'বিশেষজ্ঞ ডাক্তারের পরামর্শ ও ১০০% সঠিক পুষ্টিতে আপনার শিশুর সুস্থ বিকাশ নিশ্চিত করুন।',
        tag: 'ডাক্তারের পরামর্শ',
        image: '/assets/carousel/doctor.webp',
        imageMobile: '/assets/carousel/doctor.webp',
        imageSide: 'left',
        sortOrder: 1,
      },
      {
        id: '2',
        title: 'মা ও শিশুর যত্নে একটুও ছাড় নয়!',
        description: '১০০% প্রাকৃতিক উপাদানে তৈরি যা পার্শ্বপ্রতিক্রিয়ামুক্ত ও সম্পূর্ণ নিরাপদ।',
        tag: 'প্রাকৃতিক উপাদান',
        image: '/assets/carousel/pic2.webp',
        imageMobile: '/assets/carousel/pic2.webp',
        imageSide: 'right',
        sortOrder: 2,
      },
      {
        id: '3',
        title: 'মা ও শিশুর যত্নে একটুও ছাড় নয়!',
        description: 'হাজারো মায়েদের ভরসা ও ভালোবাসায় মিল্কিমম এগিয়ে চলেছে প্রতিদিন।',
        tag: 'মায়েদের ভরসা',
        image: '/assets/carousel/pic3.webp',
        imageMobile: '/assets/carousel/pic3.webp',
        imageSide: 'left',
        sortOrder: 3,
      },
    ],
  },
  smoothflow: {
    productSlug: 'smoothflow',
    productName: 'SmoothFlow',
    productNameEn: 'SmoothFlow',
    logoType: 'text',
    logoImage: '/images/logo.webp',
    announcementText: '42% Offer শেষ হতে বাকি',
    heroBadge: '১০০% সাইডইফেক্ট মুক্ত ও সেফ ফর্মুলা',
    heroTitle: 'বাচ্চাকে দুধ খাওয়াতে গেলেই বুকের ব্যথা? মাত্র ২৪ ঘন্টায় মুক্তি পান।',
    heroTitleHighlight: 'মাত্র ২৪ ঘন্টায় মুক্তি পান।',
    heroSubtitle: 'বুকের এক পাশে শক্ত চাকার মতো অনুভূতি, চাপ, Tenderness, আর Feed করানোর সময় অস্বস্তি—এগুলো সবই Clogged-Duct Related।',
    heroSubtitleHighlight: 'Clogged-Duct Related',
    heroCtaText: 'SmoothFlow অর্ডার করতে এখানে ক্লিক করুন',
    heroImage: '/images/product-jar.webp',
    doctorTitle: 'বিশ্বাস রাখার কারণসমূহ',
    doctorName: 'Dr. Sarah Ahmed',
    doctorDegree: 'MBBS, FCPS',
    doctorQuote: 'SmoothFlow is formulated with safe, clinically proven ingredients that gently help relieve clogged ducts and breast tenderness.',
    doctorImage: '/assets/doctor/doctor.png',
    orderHeadline: 'SmoothFlow অর্ডার করুন',
    orderSubheadline: 'Breast Pain নিয়ে আরেকটা Feeding-এর জন্য অপেক্ষা নয়।',
    guaranteeTitle: '৩ দিনের Money Back Guarantee',
    guaranteeText: 'যদি SmoothFlow ব্যবহার করে আপনি কোনো পরিবর্তন অনুভব না করেন, আমাদের জানান। আমরা আপনার সম্পূর্ণ টাকা রিফান্ড করে দেব। কোনো শর্ত প্রযোজ্য নয়।',
    footerText: 'SmoothFlow™ - মা ও সন্তানের স্বাস্থ্য সুরক্ষায় বিশ্বস্ত পার্টনার।',
    footerPhone: '01517-102603',
    footerEmail: 'milkimominfo@gmail.com',
    footerAddress: '202-J, Road-6, Mohammadiya Housing society, Mohammadpur, Dhaka.',
    howItWorksBadge: 'কি কাজ করে?',
    howItWorksTitle: 'SmoothFlow-এর ৫টি উপকারিতা',
    howItWorksSubtitle: 'প্রকৃতি ও বিজ্ঞানের সমন্বয়ে তৈরি SmoothFlow মা ও শিশু উভয়ের জন্যই সামগ্রিক উপকার নিয়ে আসে।',
    howItWorksImage: '/images/smoothflow.png',
    benefitsItems: [
      { id: '1', accent: 'Breast Pain', rest: 'থেকে মুক্তি দেয়', sortOrder: 1 },
      { id: '2', accent: 'শক্ত/চাকা-চাকা অনুভূতি', rest: 'থেকে মুক্তি দেয়', sortOrder: 2 },
      { id: '3', accent: 'Breast Pressure', rest: 'কমায়', sortOrder: 3 },
      { id: '4', accent: 'Clogged Duct', rest: 'থেকে মুক্তি দেয়', sortOrder: 4 },
      { id: '5', accent: 'Feeding-এর পরও', rest: 'রিলিফ আসে', sortOrder: 5 },
    ],
    carouselItems: [],
    doctorItems: [],
  },
};

const landingPageContentSchema = new mongoose.Schema(
  {
    productSlug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    productName: { type: String, default: '' },
    productNameEn: { type: String, default: '' },
    logoType: { type: String, enum: ['image', 'text'], default: 'image' },
    logoImage: { type: String, default: '/images/logo.webp' },
    announcementText: { type: String, default: '' },
    heroBadge: { type: String, default: '' },
    heroTitle: { type: String, default: '' },
    heroTitleHighlight: { type: String, default: '' },
    heroSubtitle: { type: String, default: '' },
    heroSubtitleHighlight: { type: String, default: '' },
    heroCtaText: { type: String, default: '' },
    heroImage: { type: String, default: '' },
    doctorTitle: { type: String, default: '' },
    doctorName: { type: String, default: '' },
    doctorDegree: { type: String, default: '' },
    doctorQuote: { type: String, default: '' },
    doctorImage: { type: String, default: '' },
    orderHeadline: { type: String, default: '' },
    orderSubheadline: { type: String, default: '' },
    guaranteeTitle: { type: String, default: '' },
    guaranteeText: { type: String, default: '' },
    footerText: { type: String, default: '' },
    footerPhone: { type: String, default: '' },
    footerEmail: { type: String, default: '' },
    footerAddress: { type: String, default: '' },
    howItWorksBadge: { type: String, default: 'কি কাজ করে?' },
    howItWorksTitle: { type: String, default: 'একটি ডোজে ৫টি উপকারিতা' },
    howItWorksSubtitle: { type: String, default: '' },
    howItWorksImage: { type: String, default: '' },
    benefitsItems: { type: Array, default: [] },
    carouselItems: { type: Array, default: [] },
    doctorItems: { type: Array, default: [] },
  },
  {
    timestamps: true,
  }
);

// Get section content by product slug, fallback to default content
landingPageContentSchema.statics.getContentBySlug = async function (slug = 'milkimom') {
  const normalizedSlug = String(slug).toLowerCase().trim();
  let content = await this.findOne({ productSlug: normalizedSlug });

  const defaultData = DEFAULT_CONTENTS[normalizedSlug] || {
    ...DEFAULT_CONTENTS.milkimom,
    productSlug: normalizedSlug,
  };

  if (!content) {
    content = await this.create({
      productSlug: normalizedSlug,
      ...defaultData,
    });
  } else {
    // Backfill defaults if benefitsItems or headers are missing on existing records
    let needsSave = false;
    if (!content.howItWorksBadge) {
      content.howItWorksBadge = defaultData.howItWorksBadge || 'কি কাজ করে?';
      needsSave = true;
    }
    if (!content.howItWorksTitle || (normalizedSlug === 'smoothflow' && (content.howItWorksTitle === 'SmoothFlow এর উপকারিতা' || content.howItWorksTitle === 'একটি ডোজে ৫টি উপকারিতা'))) {
      content.howItWorksTitle = defaultData.howItWorksTitle || 'SmoothFlow-এর ৫টি উপকারিতা';
      needsSave = true;
    }
    if (!content.howItWorksSubtitle) {
      content.howItWorksSubtitle = defaultData.howItWorksSubtitle || '';
      needsSave = true;
    }
    if (!content.benefitsItems || content.benefitsItems.length === 0 || (normalizedSlug === 'smoothflow' && content.benefitsItems[0]?.accent === 'বুকের দুধ')) {
      content.benefitsItems = defaultData.benefitsItems || [];
      needsSave = true;
    }
    if (!content.orderHeadline || (normalizedSlug === 'smoothflow' && content.orderHeadline !== defaultData.orderHeadline)) {
      content.orderHeadline = defaultData.orderHeadline || 'SmoothFlow অর্ডার করুন';
      needsSave = true;
    }
    if (!content.orderSubheadline || (normalizedSlug === 'smoothflow' && content.orderSubheadline !== defaultData.orderSubheadline)) {
      content.orderSubheadline = defaultData.orderSubheadline || 'Breast Pain নিয়ে আরেকটা Feeding-এর জন্য অপেক্ষা নয়।';
      needsSave = true;
    }
    if (!content.footerEmail || content.footerEmail === 'smoothflow@milkimom.com') {
      content.footerEmail = defaultData.footerEmail || 'milkimominfo@gmail.com';
      needsSave = true;
    }
    if (normalizedSlug === 'smoothflow' && content.heroCtaText && content.heroCtaText.includes('স্মুথফ্লো')) {
      content.heroCtaText = content.heroCtaText.replace(/স্মুথফ্লো/g, 'SmoothFlow');
      needsSave = true;
    }
    if (normalizedSlug === 'smoothflow' && (content.productName === 'স্মুথফ্লো' || !content.productName)) {
      content.productName = 'SmoothFlow';
      needsSave = true;
    }
    if (normalizedSlug === 'smoothflow' && (content.guaranteeTitle === '100% Satisfaction Guarantee' || content.guaranteeTitle.includes('১০০%') || !content.guaranteeTitle || content.guaranteeText.includes('পণ্য হাতে পেয়ে'))) {
      content.guaranteeTitle = '৩ দিনের Money Back Guarantee';
      content.guaranteeText = 'যদি SmoothFlow ব্যবহার করে আপনি কোনো পরিবর্তন অনুভব না করেন, আমাদের জানান। আমরা আপনার সম্পূর্ণ টাকা রিফান্ড করে দেব। কোনো শর্ত প্রযোজ্য নয়।';
      needsSave = true;
    }
    if (normalizedSlug === 'smoothflow' && (!content.announcementText || content.announcementText.includes('৩৯%') || content.announcementText.includes('--'))) {
      content.announcementText = '42% Offer শেষ হতে বাকি';
      needsSave = true;
    }
    if (needsSave) {
      await content.save();
    }
  }

  return content;
};

// Reset section content for a product slug back to default
landingPageContentSchema.statics.resetContentToDefault = async function (slug = 'milkimom') {
  const normalizedSlug = String(slug).toLowerCase().trim();
  const defaultData = DEFAULT_CONTENTS[normalizedSlug] || {
    ...DEFAULT_CONTENTS.milkimom,
    productSlug: normalizedSlug,
  };

  const content = await this.findOneAndUpdate(
    { productSlug: normalizedSlug },
    {
      $set: {
        productName: defaultData.productName,
        productNameEn: defaultData.productNameEn,
        logoType: defaultData.logoType,
        logoImage: defaultData.logoImage,
        announcementText: defaultData.announcementText,
        heroBadge: defaultData.heroBadge,
        heroTitle: defaultData.heroTitle,
        heroTitleHighlight: defaultData.heroTitleHighlight,
        heroSubtitle: defaultData.heroSubtitle,
        heroSubtitleHighlight: defaultData.heroSubtitleHighlight,
        heroCtaText: defaultData.heroCtaText,
        heroImage: defaultData.heroImage,
        doctorTitle: defaultData.doctorTitle,
        doctorName: defaultData.doctorName,
        doctorDegree: defaultData.doctorDegree,
        doctorQuote: defaultData.doctorQuote,
        doctorImage: defaultData.doctorImage,
        orderHeadline: defaultData.orderHeadline,
        orderSubheadline: defaultData.orderSubheadline,
        guaranteeTitle: defaultData.guaranteeTitle,
        guaranteeText: defaultData.guaranteeText,
        footerText: defaultData.footerText,
        footerPhone: defaultData.footerPhone,
        footerEmail: defaultData.footerEmail,
        footerAddress: defaultData.footerAddress,
        howItWorksBadge: defaultData.howItWorksBadge,
        howItWorksTitle: defaultData.howItWorksTitle,
        howItWorksSubtitle: defaultData.howItWorksSubtitle,
        howItWorksImage: defaultData.howItWorksImage,
        benefitsItems: defaultData.benefitsItems,
        carouselItems: defaultData.carouselItems,
        doctorItems: defaultData.doctorItems,
      },
    },
    { new: true, upsert: true }
  );

  return content;
};

const LandingPageContent = mongoose.model('LandingPageContent', landingPageContentSchema);

export default LandingPageContent;
