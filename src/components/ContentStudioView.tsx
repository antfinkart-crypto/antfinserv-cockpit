import React, { useState } from 'react';
import {
  Sparkles,
  Search,
  Download,
  Phone,
  Copy,
  Check,
  Plus,
  X,
  Upload,
  Calendar,
  Eye,
  ExternalLink,
  UserCheck
} from 'lucide-react';
import { ClientMasterRecord, Lead } from '../types';
import { generateWhatsAppUrl } from '../lib/whatsAppRouter';
import { generateBrandedPosterDataUrl, assimilateFooterOntoBase64 } from '../lib/posterCanvasGenerator';

export interface ContentPost {
  id: string;
  title: string;
  category: 'Events & Festivals' | 'Birthdays & Celebrations' | 'Mutual Funds' | 'Health Insurance' | 'Home Loans';
  date: string;
  tags: string[];
  views: number;
  bannerType: 'festive' | 'wealth' | 'protection' | 'loan' | 'celebration';
  headline: string;
  subheadline: string;
  defaultCaption: string;
  customImageUrl?: string;
  isCustom?: boolean;
}

const COMMUNITY_SIGNUP_URL = 'https://antfinserv.themfbox.com/signup';

/**
 * Formats a clean, crisp, high-conversion greeting message.
 * All statutory disclaimers are permanently baked into the image footer itself,
 * so the WhatsApp message stays short, elegant, and delightful for the client.
 */
export function formatCrispWhatsAppMessage(rawCaption: string, clientName?: string): string {
  let text = rawCaption.trim();

  // Strip any old bloated text or disclaimers if present
  if (text.includes('---')) {
    text = text.split('---')[0].trim();
  }
  if (text.includes('STATUTORY REGULATORY DISCLAIMERS')) {
    text = text.split('STATUTORY REGULATORY DISCLAIMERS')[0].trim();
  }

  // Ensure community link is present cleanly in one line
  const communityLink = `👉 Join Our Investor Community: ${COMMUNITY_SIGNUP_URL}`;
  if (!text.includes(COMMUNITY_SIGNUP_URL)) {
    text += `\n\n${communityLink}`;
  }

  // Ensure sign-off is present
  const signOff = 'Warm Regards,\nRana Sahib | AntFinServ.com (ARN-94204)';
  if (!text.includes('ARN-94204') && !text.includes('Rana Sahib')) {
    text += `\n\n${signOff}`;
  }

  // Prepend client salutation
  if (clientName && clientName.trim()) {
    if (!text.startsWith('Dear ')) {
      text = `Dear ${clientName.trim()},\n\n${text}`;
    }
  }

  return text;
}

const BUILT_IN_POSTS: ContentPost[] = [
  // 1. Featured Janmashtami Pilot Creative (TOMORROW)
  {
    id: 'EVT-JANMASHTAMI-2026',
    title: 'Krishna Janmashtami: The Sweet Power of Disciplined SIPs',
    category: 'Events & Festivals',
    date: 'Tomorrow • Janmashtami Special',
    tags: ['#HappyJanmashtami', '#KrishnaJanmashtami', '#MakhanSIP', '#WealthCreation'],
    views: 1850,
    bannerType: 'festive',
    headline: 'Happy Krishna Janmashtami!',
    subheadline: 'Just like how a little makhan built Krishna\'s strength bit by bit, a little SIP can build your family\'s lasting wealth.',
    customImageUrl: '/janmashtami.jpg',
    defaultCaption: `Happy Krishna Janmashtami! 🪈🦚✨

Every bite of makhan that little Krishna reached for added up to boundless strength. Your wealth can grow the exact same way.

This Janmashtami, take a cue from those small, joyful beginnings. Start your disciplined SIP today and let discipline shape a future as rich as your faith.`
  },

  // 2. Events & Festivals
  {
    id: 'EVT-001',
    title: 'Parsi New Year: Navroz Mubarak!',
    category: 'Events & Festivals',
    date: '15 Aug 2026',
    tags: ['#ImportantOccasions', '#NewBeginnings', '#Prosperity'],
    views: 144,
    bannerType: 'festive',
    headline: 'Navroz Mubarak!',
    subheadline: 'This new year, welcome fresh beginnings, new financial goals, and lasting prosperity for your family.',
    defaultCaption: `A new year. A fresh start. A chance to welcome all things good. ✦

May Navroz bring joy, abundance, prosperity, and togetherness to your home and loved ones.

Navroz Mubarak!`
  },
  {
    id: 'EVT-002',
    title: 'Raksha Bandhan: A Bond of Financial Protection',
    category: 'Events & Festivals',
    date: '27 Aug 2026',
    tags: ['#RakshaBandhan', '#Protection', '#GiftWealth'],
    views: 1320,
    bannerType: 'protection',
    headline: 'A Bond of True Protection',
    subheadline: 'This Rakhi, gift your sibling something that outlasts sweets: a compounding Mutual Fund SIP or Health Shield.',
    defaultCaption: `Happy Raksha Bandhan! 🌸

Beyond traditional promises, the greatest gift you can give your sibling is lifelong financial security. Start a disciplined SIP in their name or ensure your family has comprehensive health coverage.

Celebrate the eternal bond with peace of mind.`
  },
  {
    id: 'EVT-003',
    title: 'Onam: A Celebration of Abundance & Wealth',
    category: 'Events & Festivals',
    date: '25 Aug 2026',
    tags: ['#Onam', '#Abundance', '#HarvestWealth'],
    views: 628,
    bannerType: 'festive',
    headline: 'Happy Onam!',
    subheadline: 'Just like a good harvest rewards patient care, consistent investing turns small seeds into lifelong wealth.',
    defaultCaption: `Wishing you and your family a joyous and prosperous Onam! 🌾

May King Mahabali bless your home with good health, unshakeable peace, and blossoming prosperity. Harvest your wealth with patience and discipline.`
  },
  {
    id: 'EVT-004',
    title: 'Milad-un-Nabi: A Message of Peace & Giving',
    category: 'Events & Festivals',
    date: '25 Aug 2026',
    tags: ['#MiladUnNabi', '#Peace', '#Compassion'],
    views: 395,
    bannerType: 'festive',
    headline: 'Milad-un-Nabi Mubarak!',
    subheadline: 'May the teachings of compassion, peace, and patience guide our thoughts, actions, and family decisions.',
    defaultCaption: `Eid Milad-un-Nabi Mubarak! 🌙

May peace, harmony, divine blessings, and good fortune fill your home today and always.`
  },
  {
    id: 'EVT-005',
    title: 'National Sports Day: The Power of Long-Term Discipline',
    category: 'Events & Festivals',
    date: '28 Aug 2026',
    tags: ['#NationalSportsDay', '#Discipline', '#Compounding'],
    views: 535,
    bannerType: 'wealth',
    headline: 'Discipline Makes Champions',
    subheadline: 'In sports or in wealth creation, consistency beats talent. A regular monthly SIP compounds into victory.',
    defaultCaption: `Happy National Sports Day! 🏆

Champions aren't made in a day—they are built with daily practice, grit, and discipline. Wealth creation follows the exact same rule: small, unbroken monthly SIPs create extraordinary financial champions!`
  },
  {
    id: 'EVT-006',
    title: 'Senior Citizens Day: Honouring Lifetime Wisdom',
    category: 'Events & Festivals',
    date: '20 Aug 2026',
    tags: ['#SeniorCitizensDay', '#Retirement', '#Dignity'],
    views: 396,
    bannerType: 'protection',
    headline: 'Honouring Wisdom & Dignity',
    subheadline: 'Celebrating a generation that understood saving before it was trendy. Plan a peaceful, independent retirement.',
    defaultCaption: `Happy World Senior Citizens' Day! 🌺

To the elders who built our foundations with wisdom and hard work: may your golden years be filled with good health, joyful companionship, and independent financial dignity through guaranteed cash flows and SWP plans.`
  },

  // 3. Birthdays & Celebrations
  {
    id: 'CEL-001',
    title: 'Birthday Greeting: Health, Joy & Compounding Wealth',
    category: 'Birthdays & Celebrations',
    date: 'Today',
    tags: ['#HappyBirthday', '#Celebration', '#Milestone'],
    views: 890,
    bannerType: 'celebration',
    headline: 'Happy Birthday!',
    subheadline: 'Wishing you a magnificent year filled with vibrant health, cherished memories, and unstoppable wealth compounding.',
    defaultCaption: `Wishing you a very Happy Birthday! 🎂🎉

May this special day mark the beginning of an extraordinary year blessed with good health, peace of mind, family happiness, and rising prosperity.

It is our privilege to walk alongside you on your wealth-building journey!`
  },
  {
    id: 'CEL-002',
    title: 'Wedding Anniversary: Planning Your Future Together',
    category: 'Birthdays & Celebrations',
    date: 'Today',
    tags: ['#HappyAnniversary', '#FamilyWealth', '#Partnership'],
    views: 740,
    bannerType: 'celebration',
    headline: 'Happy Wedding Anniversary!',
    subheadline: 'Celebrating your beautiful partnership. As you build your life together, let your financial dreams flourish.',
    defaultCaption: `Heartiest congratulations on your Wedding Anniversary! 💐🥂

May your bond grow stronger with each passing year, and may your shared dreams of family, travel, and financial freedom blossom into reality.

Wishing you endless happiness and lasting wealth!`
  },

  // 4. Mutual Funds & SIP Wealth
  {
    id: 'MF-001',
    title: 'Child Education: Harvard or Oxford? Start With A SIP',
    category: 'Mutual Funds',
    date: '22 May 2026',
    tags: ['#ChildEducation', '#GoalBasedInvesting', '#SIP'],
    views: 5800,
    bannerType: 'wealth',
    headline: 'Harvard or Oxford For Your Child?',
    subheadline: 'Higher education costs double every 6-7 years. Let your children focus on their dreams while disciplined SIPs build their college fund.',
    defaultCaption: `Want to send your child to Harvard, Oxford, or top Indian institutes? 🎓

Education inflation in India is running at 10-12% per year. A 4-year degree costing ₹25L today will cost over ₹60L in 10 years!

Don't let finances hold your child back. Start a targeted Education Wealth SIP today.`
  },
  {
    id: 'MF-002',
    title: 'Small Daily Habits Beat Big Intentions: ₹500/Day Rule',
    category: 'Mutual Funds',
    date: '10 Mar 2026',
    tags: ['#DailyHabits', '#SIPRule', '#WealthMultiplier'],
    views: 2300,
    bannerType: 'wealth',
    headline: 'Small Habits Beat Big Intentions',
    subheadline: 'Investing ₹500 a day in an equity SIP builds ₹32 Lakhs in 10 years and over ₹1.5 Crore in 20 years!',
    defaultCaption: `Wealth rarely starts with big decisions. It starts with small habits repeated every single day. 💡

• ₹500/day spent on eating out = ₹0 wealth.
• ₹500/day invested in a disciplined 12% equity SIP:
  ➔ ₹32 Lakhs in 10 Years
  ➔ ₹1.5 Crore+ in 20 Years!

The best time to start was yesterday. The second best time is right now.`
  },
  {
    id: 'MF-003',
    title: 'How Well Is Your Portfolio Performing? Over 90% Aren\'t Sure',
    category: 'Mutual Funds',
    date: '22 Apr 2026',
    tags: ['#PortfolioReview', '#XIRRCheck', '#WealthHealth'],
    views: 1900,
    bannerType: 'wealth',
    headline: 'How Well Is Your Portfolio Performing?',
    subheadline: 'Over 90% of investors don\'t know their real XIRR. Are you holding duplicate funds or underperforming schemes?',
    defaultCaption: `A quick question for smart investors: 🤔

Do you know the exact XIRR of your Mutual Fund portfolio after accounting for taxation and fund overlap?

Holding 20 different schemes doesn't mean diversification—it often means duplicate portfolios and diluted returns.

Get a complimentary 360° Portfolio Health Audit from AntFinServ.`
  },
  {
    id: 'MF-004',
    title: '₹8,000 Weekend Parties vs ₹40 Lakhs Missed Wealth',
    category: 'Mutual Funds',
    date: '18 Jul 2026',
    tags: ['#OpportunityCost', '#MindfulSpending', '#Compounding'],
    views: 4100,
    bannerType: 'wealth',
    headline: 'Weekend Parties vs ₹40L Missed Wealth',
    subheadline: 'Cutting just one luxury weekend outing per month and investing that ₹8,000 into a SIP compounds into ₹40+ Lakhs!',
    defaultCaption: `Enjoy your weekends, but don't let lifestyle creep steal your financial freedom! 🏖️

Cutting just ONE unnecessary ₹8,000 outing per month and redirecting it into an automated 12% equity SIP creates:
➔ ₹18.5 Lakhs in 10 Years
➔ ₹40+ Lakhs in 15 Years!

Live well today, and live abundantly tomorrow.`
  },

  // 5. Health Insurance
  {
    id: 'INS-001',
    title: 'Health Insurance Claims: Your Step-by-Step Settlement Guide',
    category: 'Health Insurance',
    date: '18 Aug 2026',
    tags: ['#ClaimsSupport', '#HealthInsurance', '#ZeroHassle'],
    views: 884,
    bannerType: 'protection',
    headline: 'Claims Support When You Need It Most',
    subheadline: 'Anyone can sell you a policy. We stand with you during hospitalisation and claim settlement.',
    defaultCaption: `Medical emergencies are stressful enough. Paperwork shouldn't add to your worries. 🏥

At AntFinServ, we don't just help you choose the right health cover; our dedicated claims advocacy desk coordinates with TPAs and insurers to ensure cashless approvals and smooth reimbursements.`
  },

  // 6. Home Loans
  {
    id: 'HL-001',
    title: 'Home Loan Balance Transfer: Save Lakhs In Lifetime Interest',
    category: 'Home Loans',
    date: '14 Aug 2026',
    tags: ['#HomeLoans', '#BalanceTransfer', '#EMIReduction'],
    views: 1200,
    bannerType: 'loan',
    headline: 'Lower ROI? Calculate Before You Sign',
    subheadline: 'A 0.50% rate cut sounds exciting, but processing charges and tenure determine real savings. Get a verified audit.',
    defaultCaption: `Paying a higher interest rate on your existing Home Loan? 🏡

Before switching banks, always verify:
1. Upfront legal, processing, and MODT charges
2. Your true remaining tenure (which may have quietly stretched!)
3. Your exact break-even period

Get an institutional-grade, zero-pressure Balance Transfer Audit from AntFinServ.`
  }
];

interface ContentStudioViewProps {
  clients?: ClientMasterRecord[];
  leads?: Lead[];
}

export const ContentStudioView: React.FC<ContentStudioViewProps> = ({ clients = [], leads = [] }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [posts, setPosts] = useState<ContentPost[]>(() => {
    try {
      const saved = localStorage.getItem('antfinserv_custom_posters');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Clean up any old unassimilated Janmashtami test posts
        const filtered = parsed.filter((p: ContentPost) => !p.title.toLowerCase().includes('janmashtami'));
        localStorage.setItem('antfinserv_custom_posters', JSON.stringify(filtered));
        return [...filtered, ...BUILT_IN_POSTS];
      }
    } catch {
      // ignore
    }
    return BUILT_IN_POSTS;
  });

  const [activeModalPost, setActiveModalPost] = useState<ContentPost | null>(null);
  const [selectedClientName, setSelectedClientName] = useState<string>('');
  const [selectedClientPhone, setSelectedClientPhone] = useState<string>('');
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);
  const [pushStatusMessage, setPushStatusMessage] = useState<string | null>(null);
  const [isUploadingCustom, setIsUploadingCustom] = useState(false);
  const [isGeneratingPoster, setIsGeneratingPoster] = useState(false);

  // New Custom Post Form State
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostCategory, setNewPostCategory] = useState<ContentPost['category']>('Events & Festivals');
  const [newPostDate, setNewPostDate] = useState(() =>
    new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  );
  const [newPostHeadline, setNewPostHeadline] = useState('');
  const [newPostSubheadline, setNewPostSubheadline] = useState('');
  const [newPostCaption, setNewPostCaption] = useState('');
  const [newPostImageBase64, setNewPostImageBase64] = useState<string>('');

  const categories = [
    'All',
    'Events & Festivals',
    'Birthdays & Celebrations',
    'Mutual Funds',
    'Health Insurance',
    'Home Loans'
  ];

  const filteredPosts = posts.filter(p => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.headline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleCopyCaption = (post: ContentPost) => {
    const fullText = formatCrispWhatsAppMessage(post.defaultCaption, selectedClientName);
    navigator.clipboard.writeText(fullText);
    setCopiedPostId(post.id);
    setTimeout(() => setCopiedPostId(null), 2500);
  };

  const handleDownloadPoster = async (post: ContentPost) => {
    setIsGeneratingPoster(true);
    try {
      let dataUrl = post.customImageUrl;
      if (!dataUrl) {
        dataUrl = await generateBrandedPosterDataUrl({
          title: post.title,
          headline: post.headline,
          subheadline: post.subheadline,
          category: post.category,
          bannerType: post.bannerType
        });
      }

      const a = document.createElement('a');
      a.href = dataUrl;
      const cleanTitle = post.title.replace(/[^a-zA-Z0-9]/g, '_');
      a.download = `${cleanTitle}_ANTFINSERV.jpg`;
      a.click();
    } catch (e) {
      console.error('Failed to generate poster', e);
      alert('Unable to download poster. Please try again.');
    } finally {
      setIsGeneratingPoster(false);
    }
  };

  const handlePushWhatsApp = async (post: ContentPost) => {
    // 1. Download the high-res image automatically for the user to attach
    handleDownloadPoster(post);

    // 2. Format crisp WhatsApp text without legal clutter
    const fullText = formatCrispWhatsAppMessage(post.defaultCaption, selectedClientName);

    // 3. Open WhatsApp Web / App
    const url = generateWhatsAppUrl(selectedClientPhone || '', fullText);
    window.open(url, '_blank');

    setPushStatusMessage('WhatsApp opened & Image downloaded! Simply attach the downloaded image in chat.');
    setTimeout(() => setPushStatusMessage(null), 6000);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const rawBase64 = reader.result as string;
      // Assimilate the luxury footer strip directly onto the uploaded image!
      const assimilated = await assimilateFooterOntoBase64(rawBase64);
      setNewPostImageBase64(assimilated);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveCustomPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostTitle) {
      alert('Please enter a title for the event creative.');
      return;
    }

    const customPost: ContentPost = {
      id: `CUSTOM-${Date.now()}`,
      title: newPostTitle,
      category: newPostCategory,
      date: newPostDate,
      tags: ['#CustomUpload', `#${newPostCategory.replace(/\s+/g, '')}`],
      views: 1,
      bannerType:
        newPostCategory === 'Events & Festivals'
          ? 'festive'
          : newPostCategory === 'Birthdays & Celebrations'
          ? 'celebration'
          : newPostCategory === 'Health Insurance'
          ? 'protection'
          : newPostCategory === 'Home Loans'
          ? 'loan'
          : 'wealth',
      headline: newPostHeadline || newPostTitle,
      subheadline: newPostSubheadline || 'Personalized greetings and financial insights from AntFinServ.',
      defaultCaption: newPostCaption || `${newPostHeadline || newPostTitle}\n\n${newPostSubheadline}`,
      customImageUrl: newPostImageBase64 || undefined,
      isCustom: true
    };

    const updated = [customPost, ...posts];
    setPosts(updated);

    try {
      const customOnly = updated.filter(p => p.isCustom);
      localStorage.setItem('antfinserv_custom_posters', JSON.stringify(customOnly));
    } catch {
      // ignore
    }

    setIsUploadingCustom(false);
    setNewPostTitle('');
    setNewPostHeadline('');
    setNewPostSubheadline('');
    setNewPostCaption('');
    setNewPostImageBase64('');
    alert('Custom Creative with assimilated AntFinServ footer added successfully to your Content Library!');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs bg-white">
        <div>
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-950 border border-amber-400/40 p-1 flex-shrink-0 shadow-xs flex items-center justify-center">
              <img src="/emblem-logo.jpg" alt="AntFinServ" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl md:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
                  Content Studio & Marketing Hub
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-200 hidden sm:inline-block">
                  Janmashtami Pilot • Verified ARN-94204
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-500 mt-0.5">
                Ready-to-fire festive greetings, SIP wealth cards, and leads push queue with embedded community signup links.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsUploadingCustom(true)}
          className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs md:text-sm flex items-center gap-2 shadow-xs transition-all border border-slate-700 flex-shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>+ Upload Custom Creative / Poster</span>
        </button>
      </div>

      {/* Category Pills & Search Toolbar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-200 bg-white flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 no-scrollbar">
          {categories.map(cat => {
            const count = cat === 'All' ? posts.length : posts.filter(p => p.category === cat).length;
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-amber-800 text-amber-100' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search Janmashtami, SIP, Rakhi..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-amber-500 font-medium"
          />
        </div>
      </div>

      {/* Grid of Posters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredPosts.map(post => (
          <div
            key={post.id}
            className="glass-panel rounded-2xl border border-slate-200 overflow-hidden flex flex-col bg-white shadow-xs hover:shadow-md transition-all group"
          >
            {/* Visual Thumbnail Card */}
            <div
              onClick={() => setActiveModalPost(post)}
              className="h-60 relative overflow-hidden bg-slate-950 p-2 flex flex-col justify-between cursor-pointer"
            >
              {post.customImageUrl ? (
                <img
                  src={post.customImageUrl}
                  alt={post.title}
                  className="w-full h-full object-contain group-hover:scale-102 transition-transform duration-300 rounded-xl"
                />
              ) : (
                <div className="w-full h-full flex flex-col justify-between p-4">
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${
                      post.bannerType === 'festive'
                        ? 'from-amber-950 via-slate-950 to-stone-900'
                        : post.bannerType === 'wealth'
                        ? 'from-emerald-950 via-slate-950 to-blue-950'
                        : post.bannerType === 'protection'
                        ? 'from-blue-950 via-slate-950 to-indigo-950'
                        : post.bannerType === 'loan'
                        ? 'from-stone-950 via-slate-950 to-slate-900'
                        : 'from-purple-950 via-slate-950 to-amber-950'
                    }`}
                  />
                  <div className="relative z-10 flex items-center justify-between">
                    <span className="text-[10px] uppercase font-black tracking-wider px-2.5 py-0.5 rounded-md bg-amber-500/80 text-white shadow-xs">
                      {post.category}
                    </span>
                  </div>

                  <div className="relative z-10 space-y-1">
                    <h3 className="text-lg font-black text-white leading-tight drop-shadow-md">
                      {post.headline}
                    </h3>
                    <p className="text-[11px] text-slate-200 line-clamp-2 leading-relaxed drop-shadow-sm font-medium">
                      {post.subheadline}
                    </p>
                  </div>

                  <div className="relative z-10 pt-2 border-t border-white/20 flex items-center justify-between text-[10px] text-amber-300 font-mono">
                    <span>AntFinServ.com</span>
                    <span>ARN-94204</span>
                  </div>
                </div>
              )}
            </div>

            {/* Card Content & Action Bar */}
            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <h4 className="font-bold text-xs md:text-sm text-slate-900 line-clamp-1">
                  {post.title}
                </h4>
                <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{post.date}</span>
                  </span>
                  <span className="flex items-center gap-1 font-mono">
                    <Eye className="w-3 h-3" />
                    <span>{post.views}</span>
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveModalPost(post)}
                  className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-600" />
                  <span>View Post</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveModalPost(post)}
                  className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Push</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* ASSETPLUS STYLE POST PREVIEW & SHARE MODAL                                 */}
      {/* ========================================================================= */}
      {activeModalPost && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6">
          <div className="bg-white text-slate-900 w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col md:flex-row my-auto max-h-[95vh]">
            
            {/* Left: Pure, Seamlessly Assimilated Artwork Preview */}
            <div className="md:w-1/2 bg-slate-950 relative overflow-hidden min-h-[380px] md:min-h-[520px] flex items-center justify-center p-4">
              {activeModalPost.customImageUrl ? (
                <div className="w-full h-full flex flex-col justify-center items-center relative">
                  <img
                    src={activeModalPost.customImageUrl}
                    alt={activeModalPost.title}
                    className="w-full max-h-[500px] object-contain rounded-2xl shadow-xl border border-slate-800"
                  />
                </div>
              ) : (
                <div className="w-full h-full p-6 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase font-black tracking-wider text-amber-400">
                      {activeModalPost.category}
                    </span>
                    <div className="w-9 h-9 rounded-xl overflow-hidden border border-amber-400/40 bg-slate-900 shadow-md">
                      <img src="/emblem-logo.jpg" alt="AntFinServ" className="w-full h-full object-contain" />
                    </div>
                  </div>

                  <div className="space-y-3 my-auto py-6 text-center">
                    <div className="text-amber-400 text-lg">✦ ✦ ✦</div>
                    <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight drop-shadow-md">
                      {activeModalPost.headline}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                      {activeModalPost.subheadline}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-amber-400/40 flex items-center justify-between text-xs text-slate-300 font-mono">
                    <span>AntFinServ.com</span>
                    <span>ARN-94204 • Rana Sahib</span>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Message Details, Client/Lead Picker & Push Controls */}
            <div className="md:w-1/2 p-6 sm:p-7 flex flex-col justify-between space-y-4 bg-white overflow-y-auto max-h-[580px]">
              <div className="space-y-4">
                {/* Header with Close */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                      {activeModalPost.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                      <span>{activeModalPost.date}</span>
                      <span>•</span>
                      <span className="font-mono">{activeModalPost.views} views</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveModalPost(null)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Tags */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {activeModalPost.tags.map((t, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                {/* Embedded Community Signup Button Bar */}
                <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-black text-amber-900 uppercase tracking-wider">
                      Client Onboarding Link (Embedded):
                    </p>
                    <p className="text-[11px] text-slate-600 font-mono">
                      {COMMUNITY_SIGNUP_URL}
                    </p>
                  </div>
                  <a
                    href={COMMUNITY_SIGNUP_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs whitespace-nowrap"
                  >
                    <span>JOIN COMMUNITY</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Client Master & Leads Dropdown Picker */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span>Select Target Client / Prospect:</span>
                    </label>
                    <span className="text-[10px] text-slate-400">
                      {clients.length} Clients • {leads.length} Leads
                    </span>
                  </div>

                  <select
                    value={selectedClientName ? `${selectedClientName}|${selectedClientPhone}` : ''}
                    onChange={e => {
                      const val = e.target.value;
                      if (!val) {
                        setSelectedClientName('');
                        setSelectedClientPhone('');
                      } else {
                        const [name, phone] = val.split('|');
                        setSelectedClientName(name || '');
                        setSelectedClientPhone(phone || '');
                      }
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:outline-none focus:border-amber-500"
                  >
                    <option value="">-- Choose from Client Master or Leads --</option>
                    {leads.length > 0 && (
                      <optgroup label="🎯 New Leads & Prospects Pipeline">
                        {leads.map(l => (
                          <option key={l.id} value={`${l.owner_name}|${l.mobile}`}>
                            {l.owner_name} {l.firm_name ? `(${l.firm_name})` : ''} - {l.mobile}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {clients.length > 0 && (
                      <optgroup label="👥 Mutual Fund Client Master">
                        {clients.map(cl => (
                          <option key={cl.client_id} value={`${cl.investor_name}|${cl.mobile}`}>
                            {cl.investor_name} ({cl.mobile || 'No Mobile'})
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Or type client name..."
                      value={selectedClientName}
                      onChange={e => setSelectedClientName(e.target.value)}
                      className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-amber-500"
                    />
                    <input
                      type="text"
                      placeholder="Mobile for WhatsApp..."
                      value={selectedClientPhone}
                      onChange={e => setSelectedClientPhone(e.target.value)}
                      className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Formatted Message Draft (CRISP & ELEGANT - ZERO LEGAL SPAM) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      WhatsApp Message Draft (Crisp & High-Conversion):
                    </span>
                    <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                      ✓ Disclaimers Baked into Image Footer
                    </span>
                  </div>
                  <div className="max-h-44 overflow-y-auto p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 whitespace-pre-wrap leading-relaxed font-sans select-all">
                    {formatCrispWhatsAppMessage(activeModalPost.defaultCaption, selectedClientName)}
                  </div>
                </div>

                {pushStatusMessage && (
                  <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold text-center animate-fade-in">
                    {pushStatusMessage}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handlePushWhatsApp(activeModalPost)}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <Phone className="w-4 h-4" />
                  <span>Send via WhatsApp 1-to-1</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={isGeneratingPoster}
                    onClick={() => handleDownloadPoster(activeModalPost)}
                    className="py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isGeneratingPoster ? 'Preparing...' : 'Download Image'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopyCaption(activeModalPost)}
                    className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    {copiedPostId === activeModalPost.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-600" />
                        <span>Copy Message</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* UPLOAD CUSTOM EVENT / CREATIVE MODAL                                       */}
      {/* ========================================================================= */}
      {isUploadingCustom && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6">
          <div className="bg-white text-slate-900 w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto p-6 sm:p-7 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-amber-600" />
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  Upload Custom Event / Festival Creative
                </h3>
              </div>
              <button
                onClick={() => setIsUploadingCustom(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomPost} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Event / Festival Title (For Library Index) <span className="text-amber-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Diwali Wealth Muhurat"
                  value={newPostTitle}
                  onChange={e => setNewPostTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={newPostCategory}
                    onChange={e => setNewPostCategory(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 font-medium"
                  >
                    <option value="Events & Festivals">Events & Festivals</option>
                    <option value="Birthdays & Celebrations">Birthdays & Celebrations</option>
                    <option value="Mutual Funds">Mutual Funds</option>
                    <option value="Health Insurance">Health Insurance</option>
                    <option value="Home Loans">Home Loans</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Upcoming Event Date</label>
                  <input
                    type="text"
                    value={newPostDate}
                    onChange={e => setNewPostDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Upload Creative Image File (Will automatically assimilate AntFinServ Luxury Footer Strip)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 cursor-pointer"
                />
                {newPostImageBase64 && (
                  <div className="mt-2 w-28 h-28 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                    <img src={newPostImageBase64} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  WhatsApp Greeting / Caption Message
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter greeting message... (Community signup link will be attached automatically)"
                  value={newPostCaption}
                  onChange={e => setNewPostCaption(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUploadingCustom(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Save to Content Library</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
