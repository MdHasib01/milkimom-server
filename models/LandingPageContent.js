import mongoose from 'mongoose';

// Predefined default section content for known product landing pages
export const DEFAULT_CONTENTS = {
  milkimom: {
    productSlug: 'milkimom',
    productName: 'মিল্কিমম',
    productNameEn: 'Milkimom',
    logoType: 'image',
    logoImage: '/images/logo.webp',
    announcementText: '🎉 ১ম অর্ডারেই ১০০% ক্যাশ অন ডেলিভারি এবং সারাদেশে হোম ডেলিভারি ফ্রি!',
    heroBadge: '১০০% সাইডইফেক্ট মুক্ত ও ন্যাচারাল',
    heroTitle: '১ ডোজেই, পার্মানেন্টলি বুকের দুধ বাড়াতে মিল্কিমম খান নিশ্চিন্তে!',
    heroTitleHighlight: 'মিল্কিমম',
    heroSubtitle: 'মিল্কিমম খেলে মাত্র ৩ দিনের মধ্যেই বুকের দুধ বাড়ে, এবং ব্রেস্ট ফিডিং এর শেষ পর্যন্ত স্থায়ী হয়। এটি সম্পূর্ণ সাইডইফেক্ট মুক্ত ও ন্যাচারাল।',
    heroSubtitleHighlight: 'মাত্র ৩ দিনের মধ্যেই বুকের দুধ বাড়ে',
    heroCtaText: 'অর্ডার করতে এখানে ক্লিক করুন',
    heroImage: '/images/product-jar.webp',
    doctorTitle: 'বিশেষজ্ঞ ডাক্তারের পরামর্শ',
    doctorName: 'ডাঃ তানজিলা রহমান',
    doctorDegree: 'এমবিবিএস, এফসিপিএস (গাইনি এন্ড অব্স)',
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
        description: '১০০% প্রাকৃতিক উপাদান সমৃদ্ধ যা মায়ের বুকের দুধ বাড়াতে শতভাগ কার্যকর।',
        tag: 'প্রাকৃতিক সুরক্ষা',
        image: '/assets/carousel/pic2.webp',
        imageMobile: '/assets/carousel/pic2.webp',
        imageSide: 'right',
        sortOrder: 2,
      },
      {
        id: '3',
        title: 'মা ও শিশুর যত্নে একটুও ছাড় নয়!',
        description: 'মায়েদের বিশ্বস্ততা ও শিশুর সঠিক পুষ্টির সাথে গড়ে উঠুক সুন্দর ভবিষ্যৎ।',
        tag: 'বিশ্বস্ত পছন্দ',
        image: '/assets/carousel/pic3.webp',
        imageMobile: '/assets/carousel/pic3.webp',
        imageSide: 'left',
        sortOrder: 3,
      },
    ],
    doctorItems: [
      {
        id: 'saddam',
        name: 'ডা. মোঃ সাদ্দাম',
        degree: 'এমবিবিএস, এফসিপিএস (গাইনি এন্ড অব্স)',
        title: 'মেডিকেল বোর্ড অনুমোদিত',
        subtitle: 'চিকিৎসকের তত্ত্বাবধানে তৈরি ফর্মুলা',
        description: 'মিল্কিমম তৈরি হয়েছে গভর্নমেন্ট রেজিস্টার্ড চিকিৎসকদের তত্ত্বাবধানে, ৪৮০০+ বছরের প্রাচীন আয়ুর্বেদিক জ্ঞান ও আধুনিক বিজ্ঞানের গবেষণার সমন্বয়ে। প্রতিটি ব্যাচ ল্যাব টেস্টেড ও BSTI সার্টিফাইড, যাতে মা ও শিশু উভয়ের জন্যই এটি সম্পূর্ণ নিরাপদ থাকে।',
        image: '/assets/doctors/saddam.webp',
        sortOrder: 1,
      },
      {
        id: 'nazmul',
        name: 'ডা. মোঃ নাজমুল',
        degree: 'এমবিবিএস, ডিজিইউ, শিশু ও মাতৃ পুষ্টি বিশেষজ্ঞ',
        title: 'মেডিকেল বোর্ড অনুমোদিত',
        subtitle: 'চিকিৎসকের তত্ত্বাবধানে তৈরি ফর্মুলা',
        description: 'মিল্কিমম তৈরি হয়েছে গভর্নমেন্ট রেজিস্টার্ড চিকিৎসকদের তত্ত্বাবধানে, ৪৮০০+ বছরের প্রাচীন আয়ুর্বেদিক জ্ঞান ও আধুনিক বিজ্ঞানের গবেষণার সমন্বয়ে। প্রতিটি ব্যাচ ল্যাব টেস্টেড ও BSTI সার্টিফাইড, যাতে মা ও শিশু উভয়ের জন্যই এটি সম্পূর্ণ নিরাপদ থাকে।',
        image: '/assets/doctors/nazmul.webp',
        sortOrder: 2,
      },
    ],
  },
  smoothflow: {
    productSlug: 'smoothflow',
    productName: 'স্মুথফ্লো',
    productNameEn: 'SmoothFlow',
    logoType: 'text',
    logoImage: '/images/logo.webp',
    announcementText: '⚡ স্মুথফ্লো বিশেষ অফার! সারাদেশে ফ্রি ডেলিভারি ও দ্রুত সার্ভিস!',
    heroBadge: 'স্মুথফ্লো প্রিমিয়াম ন্যাচারাল ফর্মুলা',
    heroTitle: 'স্মুথফ্লো - মা ও শিশুর পরিপূর্ণ পুষ্টির আধুনিক সমাধান!',
    heroTitleHighlight: 'স্মুথফ্লো',
    heroSubtitle: 'প্রাকৃতিক উপাদানের সমন্বয়ে তৈরি স্মুথফ্লো মা ও শিশুর জন্য নিয়ে এলো অতুলনীয় পুষ্টি সুরক্ষা ও স্থায়ী ফলাফল।',
    heroSubtitleHighlight: 'অতুলনীয় পুষ্টি সুরক্ষা ও স্থায়ী ফলাফল',
    heroCtaText: 'স্মুথফ্লো অর্ডার করতে ক্লিক করুন',
    heroImage: '/images/product-jar.webp',
    doctorTitle: 'গাইনি ও নিউট্রিশন বিশেষজ্ঞ মত',
    doctorName: 'ডাঃ ফারহানা ইসলাম',
    doctorDegree: 'এমবিবিএস, ডিজিইউ, শিশু ও মাতৃ পুষ্টি বিশেষজ্ঞ',
    doctorQuote: 'স্মুথফ্লোর ফর্মুলেশন আন্তর্জাতিক মান অনুযায়ী তৈরি, যা মায়েদের জন্য নিরাপদ এবং প্রতিদিনের কার্যকারিতায় প্রমাণিত।',
    doctorImage: '/assets/doctor/doctor.png',
    orderHeadline: 'আজই স্মুথফ্লো™ অর্ডার করুন',
    orderSubheadline: 'বিশেষ ছাড়ে এখনই আপনার ক্যাশ অন ডেলিভারি অর্ডার দিন',
    guaranteeTitle: '১০০% কোয়ালিটি নিশ্চিতকরণ গ্যারান্টি',
    guaranteeText: 'আমাদের পণ্য সম্পূর্ণ পরীক্ষিত ও সার্টিফাইড। আমরা দিচ্ছি শতভাগ গুণগত মান ও সেবার নিশ্চয়তা।',
    footerText: 'স্মুথফ্লো™ - মা ও সন্তানের স্বাস্থ্য সুরক্ষায় বিশ্বস্ত পার্টনার।',
    footerPhone: '01517-102603',
    footerEmail: 'smoothflow@milkimom.com',
    footerAddress: '202-J, Road-6, Mohammadiya Housing society, Mohammadpur, Dhaka.',
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
        description: '১০০% প্রাকৃতিক উপাদান সমৃদ্ধ যা মায়ের বুকের দুধ বাড়াতে শতভাগ কার্যকর।',
        tag: 'প্রাকৃতিক সুরক্ষা',
        image: '/assets/carousel/pic2.webp',
        imageMobile: '/assets/carousel/pic2.webp',
        imageSide: 'right',
        sortOrder: 2,
      },
      {
        id: '3',
        title: 'মা ও শিশুর যত্নে একটুও ছাড় নয়!',
        description: 'মায়েদের বিশ্বস্ততা ও শিশুর সঠিক পুষ্টির সাথে গড়ে উঠুক সুন্দর ভবিষ্যৎ।',
        tag: 'বিশ্বস্ত পছন্দ',
        image: '/assets/carousel/pic3.webp',
        imageMobile: '/assets/carousel/pic3.webp',
        imageSide: 'left',
        sortOrder: 3,
      },
    ],
    doctorItems: [
      {
        id: 'saddam',
        name: 'ডা. মোঃ সাদ্দাম',
        degree: 'এমবিবিএস, এফসিপিএস (গাইনি এন্ড অব্স)',
        title: 'মেডিকেল বোর্ড অনুমোদিত',
        subtitle: 'চিকিৎসকের তত্ত্বাবধানে তৈরি ফর্মুলা',
        description: 'স্মুথফ্লো তৈরি হয়েছে গভর্নমেন্ট রেজিস্টার্ড চিকিৎসকদের তত্ত্বাবধানে, প্রাচীন আয়ুর্বেদিক জ্ঞান ও আধুনিক বিজ্ঞানের গবেষণার সমন্বয়ে।',
        image: '/assets/doctors/saddam.webp',
        sortOrder: 1,
      },
      {
        id: 'nazmul',
        name: 'ডা. মোঃ নাজমুল',
        degree: 'এমবিবিএস, ডিজিইউ, শিশু ও মাতৃ পুষ্টি বিশেষজ্ঞ',
        title: 'মেডিকেল বোর্ড অনুমোদিত',
        subtitle: 'চিকিৎসকের তত্ত্বাবধানে তৈরি ফর্মুলা',
        description: 'স্মুথফ্লো তৈরি হয়েছে গভর্নমেন্ট রেজিস্টার্ড চিকিৎসকদের তত্ত্বাবধানে, প্রাচীন আয়ুর্বেদিক জ্ঞান ও আধুনিক বিজ্ঞানের গবেষণার সমন্বয়ে।',
        image: '/assets/doctors/nazmul.webp',
        sortOrder: 2,
      },
    ],
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

  if (!content) {
    const defaultData = DEFAULT_CONTENTS[normalizedSlug] || {
      ...DEFAULT_CONTENTS.milkimom,
      productSlug: normalizedSlug,
    };

    content = await this.create({
      productSlug: normalizedSlug,
      ...defaultData,
    });
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
