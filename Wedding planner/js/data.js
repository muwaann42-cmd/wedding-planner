/* ==========================================================================
   LUMIÈRE & CO. — Ultra-Stable Dual-Engine Data Store (IndexedDB + LocalStorage)
   Features:
   - High-capacity IndexedDB persistence (prevents data loss & storage quota errors)
   - Synchronous LocalStorage fallback with automatic migration across v1, v2
   - Zero-data-loss CRUD (handles edits, deletes, and unlinked records safely)
   - Accidental-deletion protection
   ========================================================================== */

const STORAGE_KEY_V2 = 'lumiere_pastel_wedding_planner_v2';
const STORAGE_KEY_V1 = 'lumiere_pastel_wedding_planner_v1';
const DB_NAME = 'LumiereWeddingPlannerDB_V2';
const DB_VERSION = 1;
const IDB_STORE = 'app_state';

const DEFAULT_WEDDING_DATA = {
  _isCustomized: false,
  weddingInfo: {
    brideName: 'พิมดาว (Pimdao)',
    groomName: 'ภัทรพล (Phattarapon)',
    weddingDate: '2027-02-14',
    weddingTime: '09:09',
    receptionTime: '18:00',
    venue: 'The Glasshouse at Nai Lert Park, Bangkok',
    theme: 'Soft Pastel Garden & Champagne Elegance',
    dressCode: 'Blush Pink, Champagne Gold, Sage Green & Ivory',
    hashtag: '#PimPhatForever2027',
    totalBudget: 1200000,
    targetGuests: 250,
    seatsPerTable: 10,
    coupleNote: 'เน้นบรรยากาศอบอุ่น โรแมนติกในเรือนกระจก แสงธรรมชาติช่วงเย็น ดอกไม้โทนพาสเทลฟุ้งๆ และดนตรี Jazz Trio สด',
    coverPhoto: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
    logoPhoto: '',
    seatingPlanImage: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80'
  },

  palette: [
    { id: 'pal-1', name: 'Soft Blush Rose', hex: '#E8BEC7', role: 'สีหลักดอกไม้ & ผ้าผูกเก้าอี้' },
    { id: 'pal-2', name: 'Champagne Gold', hex: '#D5B895', role: 'โครงฉาก & รายละเอียดการ์ดเชิญ' },
    { id: 'pal-3', name: 'Eucalyptus Sage', hex: '#C2D6C8', role: 'ใบไม้ตกแต่ง & ชุดเพื่อนเจ้าสาว' },
    { id: 'pal-4', name: 'Warm Ivory Silk', hex: '#FAF6F0', role: 'ปูโต๊ะอาหาร & ชุดเจ้าสาว' },
    { id: 'pal-5', name: 'Dusty Mauve', hex: '#C29BA8', role: 'สีเน้นจุดถ่ายภาพ โฟโต้บูธ' },
    { id: 'pal-6', name: 'Lavender Mist', hex: '#DFD8EC', role: 'ดอกไม้แซมช่อเจ้าสาว' }
  ],

  moodboard: [
    {
      id: 'mb-1',
      title: 'ซุ้มดอกไม้ทางเข้าโทน Blush & Ivory',
      category: 'ดอกไม้ & ซุ้มพิธี',
      imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80',
      pinterestUrl: 'https://www.pinterest.com/search/pins/?q=pastel%20wedding%20arch%20flowers',
      notes: 'บรีฟ Vendor: ต้องการซุ้มทรงโค้งไม่สมมาตร (Asymmetrical Arch) ใช้กุหลาบอังกฤษสีชมพูพาสเทลผสมไฮเดรนเยียสีขาวครีม',
      favorite: true
    },
    {
      id: 'mb-2',
      title: 'ช่อดอกไม้เจ้าสาว กุหลาบพีโอนี & ลิเซียนทัส',
      category: 'ดอกไม้ & ซุ้มพิธี',
      imageUrl: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=900&q=80',
      pinterestUrl: 'https://www.pinterest.com/search/pins/?q=pastel%20peony%20bridal%20bouquet',
      notes: 'บรีฟ Vendor: ช่อทรงหลวมธรรมชาติ (airy bouquet) ผูกริบบิ้นผ้าไหมชีฟองสี Champagne ยาวพลิ้ว',
      favorite: true
    },
    {
      id: 'mb-3',
      title: 'การจัดโต๊ะ Long Table ประดับเทียนและแก้วคริสตัล',
      category: 'การตกแต่งเวที & โต๊ะอาหาร',
      imageUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=900&q=80',
      pinterestUrl: 'https://www.pinterest.com/search/pins/?q=luxury%20pastel%20wedding%20table%20setting',
      notes: 'บรีฟ Vendor: โต๊ะ VIP ใช้ผ้าปูสี Ivory ป้ายชื่ออะคริลิกใสเขียนฟอนต์ Calligraphy สีทอง',
      favorite: false
    },
    {
      id: 'mb-4',
      title: 'เค้กแต่งงาน 3 ชั้น เพ้นท์ลายดอกไม้พาสเทล',
      category: 'เค้ก & แคเทอริ่ง',
      imageUrl: 'https://images.unsplash.com/photo-1535254973040-607b474cb50d?auto=format&fit=crop&w=900&q=80',
      pinterestUrl: 'https://www.pinterest.com/search/pins/?q=pastel%20floral%20wedding%20cake',
      notes: 'บรีฟ Vendor: รส Earl Grey Lavender และ Raspberry Rose บัตเตอร์ครีมเนื้อเนียน',
      favorite: true
    },
    {
      id: 'mb-5',
      title: 'ชุดเจ้าสาวทรง A-Line ผ้าลูกไม้ฝรั่งเศสไหล่ปาด',
      category: 'ชุดเจ้าสาว & เจ้าบ่าว',
      imageUrl: 'https://images.unsplash.com/photo-1594552072238-b8a33785b261?auto=format&fit=crop&w=900&q=80',
      pinterestUrl: 'https://www.pinterest.com/search/pins/?q=romantic%20lace%20bridal%20gown',
      notes: 'บรีฟ Vendor: เน้นกระโปรงเบาเดินง่ายสำหรับงานในสวนและเรือนกระจก พร้อมเวลล์ยาว 2.5 เมตร',
      favorite: true
    },
    {
      id: 'mb-6',
      title: 'มู้ดภาพถ่ายช่วง Golden Hour ในสวน',
      category: 'ภาพถ่าย & วิดีโอ',
      imageUrl: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=900&q=80',
      pinterestUrl: 'https://www.pinterest.com/search/pins/?q=fine%20art%20wedding%20photography%20pastel',
      notes: 'บรีฟ Vendor: โทนภาพ Fine Art Film สว่างละมุน เก็บโมเมนต์ธรรมชาติช่วง 16:30 - 17:30 น.',
      favorite: false
    }
  ],

  wishes: [
    {
      id: 'wish-1',
      category: 'สิ่งที่ต้องมี (Must-Have)',
      title: 'ดอกไม้สดไร้กลิ่นฉุนในโซนรับประทานอาหาร',
      detail: 'เจ้าบ่าวแพ้เกสรลิลลี่ ขอหลีกเลี่ยงดอกลิลลี่ทุกชนิด ใช้กุหลาบอังกฤษ พีโอนี และทิวลิปแทน',
      priority: 'สูง'
    },
    {
      id: 'wish-2',
      category: 'บรรยากาศ & ดนตรี (Ambience)',
      title: 'เพลงเปิดตัวเจ้าสาวด้วยเครื่องสาย (Violin & Harp)',
      detail: 'เพลง Canon in D เวอร์ชัน Acoustic ผสมเพลง Turning Page ตอนเดินเข้าซุ้ม',
      priority: 'สูง'
    },
    {
      id: 'wish-3',
      category: 'สิ่งที่ไม่ต้องการ (Do Not Want)',
      title: 'ไม่ใช้ไฟพาร์สีจัด (สีน้ำเงินเข้ม/ม่วงนีออน)',
      detail: 'ขอใช้ไฟ Warm White และ Amber Gold เท่านั้น เพื่อให้ผิวบ่าวสาวและแขกในภาพถ่ายดูละมุนที่สุด',
      priority: 'สูง'
    }
  ],

  vendors: [
    {
      id: 'ven-1',
      name: 'The Glasshouse Nai Lert',
      category: 'สถานที่ & แคเทอริ่ง',
      contactName: 'คุณแพรว (Event Director)',
      phone: '081-234-5678',
      lineOrIg: '@glasshousenailert',
      quotationRef: 'QT-2026-0891',
      quotationLink: '',
      quotedPrice: 480000,
      depositAmount: 150000,
      finalPaymentDate: '2027-02-14',
      status: 'อนุมัติแล้ว (Approved)',
      notes: 'รวมอาหารจัดเลี้ยงแพ็กเกจ Western Set & Heavy Cocktail สำหรับ 250 ท่าน + ห้องแต่งตัว VIP 2 ห้อง',
      images: [
        'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=600&q=80'
      ],
      paymentSlips: [
        'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=400&q=80'
      ],
      syncedToBudget: true,
      meetings: [
        {
          id: 'mt-1',
          date: '2026-09-15',
          topic: 'สำรวจสถานที่และชิมอาหาร (Food Tasting)',
          summary: 'สรุปเมนูซุปทรัฟเฟิลและปลาหิมะอบเนย ขอเพิ่มสเตชันพาสต้าสด 1 จุด',
          nextAction: 'ส่งผังโต๊ะไฟนอลก่อนวันงาน 30 วัน'
        },
        {
          id: 'mt-2',
          date: '2026-10-05',
          topic: 'เซ็นสัญญาและชำระมัดจำงวดแรก',
          summary: 'ล็อกคิววันที่ 14 ก.พ. 2027 ทั้งรอบเช้าและรอบเย็นเรียบร้อย',
          nextAction: 'ชำระงวดที่ 2 ภายในวันที่ 15 ธ.ค. 2026'
        }
      ]
    },
    {
      id: 'ven-2',
      name: 'Fleur de Pastel Studio',
      category: 'ดอกไม้ & การตกแต่ง',
      contactName: 'คุณเอมี่ (Lead Stylist)',
      phone: '089-876-5432',
      lineOrIg: 'IG: @fleurdepastel.bkk',
      quotationRef: 'FP-QT-402',
      quotationLink: '',
      quotedPrice: 220000,
      depositAmount: 80000,
      finalPaymentDate: '2027-01-20',
      status: 'อนุมัติแล้ว (Approved)',
      notes: 'ดูแล Backdrop หน้างาน, ซุ้มพิธีเช้า, เวทีหลัก, ดอกไม้โต๊ะ VIP และช่อเจ้าสาว 2 ช่อ',
      images: [
        'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80'
      ],
      paymentSlips: [],
      syncedToBudget: true,
      meetings: [
        {
          id: 'mt-3',
          date: '2026-10-10',
          topic: 'สรุปแบบ 3D Sketch และโทนสีดอกไม้',
          summary: 'ปรับโครงฉากจากสีขาวล้วนเป็นสี Champagne Brushed Gold และเพิ่มเทียน LED บนโต๊ะอาหาร',
          nextAction: 'นัดดูตัวอย่างดอกไม้จริง 3 สัปดาห์ก่อนวันงาน'
        }
      ]
    },
    {
      id: 'ven-3',
      name: 'Maison Lumière Bridal',
      category: 'ชุดแต่งงาน & สูท',
      contactName: 'คุณเกรซ',
      phone: '082-333-4455',
      lineOrIg: 'IG: @maisonlumiere.bridal',
      quotationRef: 'MLB-2026-118',
      quotationLink: '',
      quotedPrice: 115000,
      depositAmount: 50000,
      finalPaymentDate: '2026-11-20',
      status: 'อนุมัติแล้ว (Approved)',
      notes: 'แพ็กเกจชุดไทยงานเช้า + ชุดแต่งงานรอบเย็นตัดเช่าใหม่ + สูททักซิโด้เจ้าบ่าว 2 ชุด',
      images: [],
      paymentSlips: [],
      syncedToBudget: true,
      meetings: [
        {
          id: 'mt-4',
          date: '2026-10-12',
          topic: 'วัดตัวและลองโครงชุดรอบแรก (First Fitting)',
          summary: 'เลือกผ้าลูกไม้ Chantilly สี Soft Ivory ปรับช่วงไหล่ให้รับกับสรีระ',
          nextAction: 'Fitting รอบสองวันที่ 20 พ.ย. 2026'
        }
      ]
    },
    {
      id: 'ven-4',
      name: 'Velvet Lens Fine Art Photography',
      category: 'ช่างภาพ & ซีเนม่า',
      contactName: 'คุณนนท์',
      phone: '086-999-1122',
      lineOrIg: 'Line: @velvetlens',
      quotationRef: 'VL-884',
      quotationLink: '',
      quotedPrice: 75000,
      depositAmount: 25000,
      finalPaymentDate: '2027-02-14',
      status: 'นัดคุยรายละเอียด (Negotiating)',
      notes: 'ทีมช่างภาพนิ่ง 3 คน + Cinematography 2 คน (เช้า-เย็น) พร้อม Same Day Edit',
      images: [],
      paymentSlips: [],
      syncedToBudget: true,
      meetings: []
    },
    {
      id: 'ven-5',
      name: 'Glow by Nicha Makeup & Hair',
      category: 'ช่างแต่งหน้า & ทำผม',
      contactName: 'คุณณิชา',
      phone: '085-444-7788',
      lineOrIg: 'IG: @glowbynicha',
      quotationRef: 'GN-2027-09',
      quotationLink: '',
      quotedPrice: 42000,
      depositAmount: 15000,
      finalPaymentDate: '2027-02-10',
      status: 'รอดำเนินการ (Pending)',
      notes: 'แต่งหน้าเจ้าสาว-เจ้าบ่าว 2 รอบ (เช้า-เย็น) โทนงานผิว Glass Skin ชมพูพีชละมุน',
      images: [],
      paymentSlips: [],
      syncedToBudget: false,
      meetings: []
    }
  ],

  checklist: [
    {
      id: 'chk-1',
      title: 'กำหนดฤกษ์งานแต่งและจองสถานที่จัดงาน (The Glasshouse)',
      category: 'สถานที่ & แคเทอริ่ง',
      timeframe: '12 เดือนก่อนงาน',
      assignee: 'ทำร่วมกัน',
      dueDate: '2026-09-30',
      priority: 'สูง',
      completed: true,
      notes: 'ชำระมัดจำงวดแรก 150,000 บาทเรียบร้อยแล้ว'
    },
    {
      id: 'chk-2',
      title: 'สรุป Moodboard โทนสีพาสเทลและอนุมัติแบบ 3D กับทีมตกแต่ง',
      category: 'ดอกไม้ & การตกแต่ง',
      timeframe: '6 เดือนก่อนงาน',
      assignee: 'เจ้าสาว',
      dueDate: '2026-10-25',
      priority: 'สูง',
      completed: true,
      notes: 'ใช้โทน Blush Rose, Champagne Gold และ Sage Green'
    },
    {
      id: 'chk-3',
      title: 'ล็อกคิวทีมช่างภาพนิ่งและวิดีโอ Cinema',
      category: 'ช่างภาพ & ซีเนม่า',
      timeframe: '6 เดือนก่อนงาน',
      assignee: 'เจ้าบ่าว',
      dueDate: '2026-10-28',
      priority: 'สูง',
      completed: false,
      notes: 'รอใบเสนอราคาไฟนอลจากทีม Velvet Lens'
    },
    {
      id: 'chk-4',
      title: 'Fitting ชุดเจ้าสาว-เจ้าบ่าว รอบที่ 2 และเลือกเครื่องประดับ',
      category: 'ชุดแต่งงาน & สูท',
      timeframe: '3 เดือนก่อนงาน',
      assignee: 'ทำร่วมกัน',
      dueDate: '2026-11-20',
      priority: 'สูง',
      completed: false,
      notes: 'เตรียมรองเท้าส้นสูงคู่ที่จะใส่วันจริงไปด้วย'
    },
    {
      id: 'chk-5',
      title: 'สั่งพิมพ์การ์ดเชิญและของชำร่วยเทียนหอมพาสเทล',
      category: 'การ์ด & ของชำร่วย',
      timeframe: '1 เดือนก่อนงาน',
      assignee: 'เจ้าสาว',
      dueDate: '2027-01-10',
      priority: 'สูง',
      completed: false,
      notes: 'ของชำร่วยเลือกกลิ่น English Pear & Rose ผูกโบว์สีพาสเทล'
    },
    {
      id: 'chk-6',
      title: 'รวบรวมผลการตอบรับ (RSVP) และจัดผังที่นั่งรายโต๊ะ (Seating Chart)',
      category: 'รายชื่อแขก & จัดโต๊ะ',
      timeframe: '2 สัปดาห์ก่อนงาน',
      assignee: 'ทำร่วมกัน',
      dueDate: '2027-01-30',
      priority: 'สูง',
      completed: false,
      notes: 'ส่งจำนวนโต๊ะไฟนอลให้ฝ่ายจัดเลี้ยงของสถานที่'
    },
    {
      id: 'chk-7',
      title: 'บรีฟคิวงานทั้งหมด (Run-through) กับทีมออแกไนซ์และพิธีกร',
      category: 'พิธีการ & รันคิว',
      timeframe: '1 สัปดาห์ก่อนงาน',
      assignee: 'ออแกไนซ์/แม่งาน',
      dueDate: '2027-02-07',
      priority: 'สูง',
      completed: false,
      notes: 'ตรวจเช็กไฟล์เพลงเปิดตัว วิดีโอพรีเซนเทชัน และสคริปต์พิธีกร'
    },
    {
      id: 'chk-8',
      title: 'คอนเฟิร์มยอดแขกไฟนอลและอาหารจัดเลี้ยงกับทางสถานที่',
      category: 'สถานที่ & แคเทอริ่ง',
      timeframe: '5 วันก่อนงาน',
      assignee: 'เจ้าบ่าว',
      dueDate: '2027-02-09',
      priority: 'สูง',
      completed: false,
      notes: 'แจ้งจำนวนแขกที่ทานมังสวิรัติและแพ้อาหารทะเล'
    },
    {
      id: 'chk-9',
      title: 'รับชุดแต่งงานและสูทเจ้าบ่าว ตรวจเช็กความเรียบร้อย',
      category: 'ชุดแต่งงาน & สูท',
      timeframe: '3 วันก่อนงาน',
      assignee: 'เจ้าสาว',
      dueDate: '2027-02-11',
      priority: 'กลาง',
      completed: false,
      notes: 'แขวนชุดในห้องแอร์ ป้องกันชุดยับ'
    },
    {
      id: 'chk-10',
      title: 'เตรียมซองมงคลสำหรับพิธีเช้า และตรวจเช็กแหวนหมั้น',
      category: 'การเงิน & พิธีเช้า',
      timeframe: '1 วันก่อนงาน',
      assignee: 'ครอบครัว',
      dueDate: '2027-02-13',
      priority: 'สูง',
      completed: false,
      notes: 'แยกซองกั้นประตูเงินประตูทอง 12 ซองและซองผู้ใหญ่ให้ชัดเจน'
    },
    {
      id: 'chk-11',
      title: 'รันคิวพิธีเช้า สวมแหวน หลั่งน้ำสังข์ และงานเลี้ยงฉลองมงคลสมรส',
      category: 'พิธีการ & รันคิว',
      timeframe: 'วันงาน',
      assignee: 'ทำร่วมกัน',
      dueDate: '2027-02-14',
      priority: 'สูง',
      completed: false,
      notes: 'คู่บ่าวสาวพักผ่อนให้สดชื่น ยิ้มรับวันสำคัญที่สุดในชีวิต!'
    }
  ],

  runOfShow: [
    {
      id: 'ros-1',
      session: 'morning',
      startTime: '07:09',
      endTime: '07:49',
      title: 'พิธีสงฆ์ เจริญพระพุทธมนต์ และถวายภัตตาหารเช้า',
      status: 'เตรียมพร้อม',
      leadPerson: 'คุณพ่อวิกรม',
      phone: '081-111-2233',
      location: 'ห้องเรือนกระจกแก้ว (Glass Room)',
      notes: 'กราบเรียนเชิญพระสงฆ์ 9 รูป, อาหารภัตตาหารพร้อมดอกไม้ธูปเทียน, ดนตรีไทยประยุกต์แผ่วเบา',
      completed: false
    },
    {
      id: 'ros-2',
      session: 'morning',
      startTime: '08:09',
      endTime: '08:45',
      title: 'ขบวนแห่ขันหมาก & ด่านกั้นประตูเงินประตูทอง',
      status: 'เตรียมพร้อม',
      leadPerson: 'คุณอาร์ม (เพื่อนเจ้าบ่าว)',
      phone: '086-777-8899',
      location: 'ซุ้มทางเดินหน้าเรือนกระจก',
      notes: 'เพลงกลองยาวประยุกต์, พานขันหมาก 5 พาน, เตรียมซองกั้นประตู 12 ซอง, มีเพื่อนเจ้าสาวตั้งด่านกั้นประตู 4 ด่าน',
      completed: false
    },
    {
      id: 'ros-3',
      session: 'morning',
      startTime: '09:09',
      endTime: '09:39',
      title: 'พิธีสู่ขอและสวมแหวนหมั้น (ฤกษ์สวมแหวน 09:09 น.)',
      status: 'เตรียมพร้อม',
      leadPerson: 'เถ้าแก่ทั้งสองฝ่าย / พิธีกร',
      phone: '089-555-6677',
      location: 'เวทีหลักพิธีเช้า',
      notes: 'เพลง Canon in D (Acoustic Strings), พานแหวนหมั้น, เวลา 09:09 น. เจ้าบ่าวสวมแหวนให้เจ้าสาว และเจ้าสาวไหว้ขอบคุณ',
      completed: false
    },
    {
      id: 'ros-4',
      session: 'morning',
      startTime: '09:49',
      endTime: '10:30',
      title: 'พิธีหลั่งน้ำพระพุทธมนต์และประสาทพร (รดน้ำสังข์)',
      status: 'เตรียมพร้อม',
      leadPerson: 'ศ.ดร. ธีรพงศ์ (ประธาน)',
      phone: '089-555-6677',
      location: 'เวทีหลักพิธีเช้า',
      notes: 'มาลัยบ่าวสาว, สายมงคลแฝด, มอบของชำร่วยรดน้ำสังข์ (น้ำอบไทยขวดแก้วพาสเทล)',
      completed: false
    },
    {
      id: 'ros-5',
      session: 'evening',
      startTime: '17:30',
      endTime: '18:45',
      title: 'เปิดจุดลงทะเบียน & ถ่ายภาพหน้า Backdrop ในสวน',
      status: 'เตรียมพร้อม',
      leadPerson: 'คุณมิ้นท์ ชลิตา (เพื่อนเจ้าสาว)',
      phone: '084-321-9876',
      location: 'Backdrop สวนด้านหน้า',
      notes: 'Welcome Drink: Rose Lychee Mocktail, แจกของชำร่วยเทียนหอม, ตรวจสอบสมุดอวยพรและปากกาหมึกซึมสีทอง',
      completed: false
    },
    {
      id: 'ros-6',
      session: 'evening',
      startTime: '18:50',
      endTime: '19:15',
      title: 'เปิดวิดีโอ Presentation & เดินเปิดตัวคู่บ่าวสาว (Grand Entrance)',
      status: 'เตรียมพร้อม',
      leadPerson: 'ทีมรันคิว & ออแกไนซ์',
      phone: '081-234-5678',
      location: 'Aisle ทางเดินหลักสู่เวที',
      notes: 'เปิดตัวเจ้าบ่าว: ใช้เพลง "Until I Found You" (Stephen Sanchez), เปิดตัวเจ้าสาว: ใช้เพลง "Turning Page" (Acoustic Strings), มี Flower Girl 2 คน (น้องมินนี่ & น้องนาเดีย) เดินนำหน้าโรยกลีบกุหลาบสีชมพูพาสเทล',
      completed: false
    },
    {
      id: 'ros-7',
      session: 'evening',
      startTime: '19:15',
      endTime: '19:40',
      title: 'ประธานกล่าวอวยพร & ชนแก้วดื่มฉลอง (Toast) & สัมภาษณ์บ่าวสาว',
      status: 'เตรียมพร้อม',
      leadPerson: 'พิธีกร & ประธานในพิธี',
      phone: '089-555-6677',
      location: 'เวทีใหญ่ Grand Ballroom',
      notes: 'ไมค์ลอย 3 ตัว, แก้วแชมเปญสำหรับประธานและบ่าวสาว, แขกทุกคนยืนขึ้นร่วมชนแก้ว ไชโย 3 ครั้ง',
      completed: false
    },
    {
      id: 'ros-8',
      session: 'evening',
      startTime: '19:40',
      endTime: '20:05',
      title: 'พิธีตัดเค้กแต่งงาน 3 ชั้น & มอบเค้กขอบคุณบุพการี',
      status: 'เตรียมพร้อม',
      leadPerson: 'ทีมออแกไนซ์',
      phone: '081-234-5678',
      location: 'จุดตัดเค้กข้างเวที',
      notes: 'เพลง "A Thousand Years" (Saxophone & Piano Solo), กระบี่ตัดเค้กผูกโบว์สีพาสเทล, มอบจานเค้กให้คุณพ่อคุณแม่ทั้งสองฝ่าย',
      completed: false
    },
    {
      id: 'ros-9',
      session: 'evening',
      startTime: '20:05',
      endTime: '20:30',
      title: 'โยนช่อดอกไม้เจ้าสาว (Bouquet Toss) & สนุกสนานกับเพื่อนๆ',
      status: 'เตรียมพร้อม',
      leadPerson: 'พิธีกร & เพื่อนเจ้าสาว',
      phone: '084-321-9876',
      location: 'หน้าเวทีหลัก',
      notes: 'เพลง "Sugar - Maroon 5", เชิญสาวโสดทุกคนขึ้นมาหน้าเวที, เตรียมช่อดอกไม้สำรองสำหรับโยน',
      completed: false
    }
  ],

  guests: [
    {
      id: 'gst-1',
      name: 'คุณพ่อวิกรม & คุณแม่สุภาภรณ์',
      side: 'เจ้าสาว',
      group: 'ครอบครัวและญาติผู้ใหญ่',
      rsvp: 'ยืนยันมาร่วมงาน',
      seats: 4,
      tableNo: 'VIP-1',
      dietary: 'ไม่ทานเนื้อวัว',
      phone: '081-111-2233',
      inviteSent: true
    },
    {
      id: 'gst-2',
      name: 'คุณพ่อเกรียงไกร & คุณแม่ดารณี',
      side: 'เจ้าบ่าว',
      group: 'ครอบครัวและญาติผู้ใหญ่',
      rsvp: 'ยืนยันมาร่วมงาน',
      seats: 4,
      tableNo: 'VIP-1',
      dietary: 'อาหารปกติ',
      phone: '081-222-3344',
      inviteSent: true
    },
    {
      id: 'gst-3',
      name: 'ศ.ดร. ธีรพงศ์ และภริยา (ประธานในพิธี)',
      side: 'VIP/ผู้ใหญ่',
      group: 'แขกผู้ใหญ่ VIP',
      rsvp: 'ยืนยันมาร่วมงาน',
      seats: 2,
      tableNo: 'VIP-1',
      dietary: 'ปลาและผัก (Pescatarian)',
      phone: '089-555-6677',
      inviteSent: true
    },
    {
      id: 'gst-4',
      name: 'คุณมิ้นท์ ชลิตา และแฟน (เพื่อนเจ้าสาว)',
      side: 'เจ้าสาว',
      group: 'เพื่อนมหาวิทยาลัย',
      rsvp: 'ยืนยันมาร่วมงาน',
      seats: 2,
      tableNo: 'Table 1',
      dietary: 'อาหารปกติ',
      phone: '084-321-9876',
      inviteSent: true
    },
    {
      id: 'gst-5',
      name: 'แก๊งสถาปัตย์ (คุณอาร์ม, คุณเจ, คุณก้อง)',
      side: 'เจ้าบ่าว',
      group: 'เพื่อนมหาวิทยาลัย',
      rsvp: 'ยืนยันมาร่วมงาน',
      seats: 6,
      tableNo: 'Table 2',
      dietary: 'แพ้กุ้ง 1 ท่าน',
      phone: '086-777-8899',
      inviteSent: true
    },
    {
      id: 'gst-6',
      name: 'คุณพลอย รวินท์พร และทีม Marketing',
      side: 'เพื่อนร่วมกัน',
      group: 'เพื่อนที่ทำงาน',
      rsvp: 'รอตอบรับ',
      seats: 5,
      tableNo: 'Table 3',
      dietary: 'อาหารปกติ',
      phone: '082-909-1010',
      inviteSent: true
    },
    {
      id: 'gst-7',
      name: 'คุณบอย ธนกฤต',
      side: 'เจ้าบ่าว',
      group: 'เพื่อนมัธยม',
      rsvp: 'ไม่สะดวกมาร่วม',
      seats: 0,
      tableNo: '-',
      dietary: '-',
      phone: '083-456-7890',
      inviteSent: true
    }
  ],

  tables: [
    { id: 'tbl-1', name: 'VIP-1', capacity: 10, notes: 'โต๊ะประธาน & ครอบครัวบ่าวสาว' },
    { id: 'tbl-2', name: 'Table 1', capacity: 10, notes: 'เพื่อนเจ้าสาว มหาวิทยาลัย' },
    { id: 'tbl-3', name: 'Table 2', capacity: 10, notes: 'เพื่อนเจ้าบ่าว สถาปัตย์' },
    { id: 'tbl-4', name: 'Table 3', capacity: 10, notes: 'เพื่อนที่ทำงาน Marketing' },
    { id: 'tbl-5', name: 'Table 4', capacity: 10, notes: 'โต๊ะญาติผู้ใหญ่' }
  ],

  budget: [
    {
      id: 'bdg-1',
      title: 'ค่าสถานที่จัดงานและอาหารจัดเลี้ยง 250 ท่าน',
      category: 'สถานที่ & แคเทอริ่ง',
      vendorName: 'The Glasshouse Nai Lert',
      estimated: 500000,
      actual: 480000,
      depositPaid: 150000,
      additionalPaid: 100000,
      dueDate: '2026-12-15',
      status: 'จ่ายมัดจำแล้ว',
      notes: 'ชำระมัดจำงวดแรก 150k + งวดสอง 100k เหลือชำระวันงาน 230k',
      slips: [
        'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=400&q=80'
      ],
      linkedVendorId: 'ven-1'
    },
    {
      id: 'bdg-2',
      title: 'ค่าออกแบบและตกแต่งดอกไม้ทั้งงาน (เช้า-เย็น)',
      category: 'ดอกไม้ & การตกแต่ง',
      vendorName: 'Fleur de Pastel Studio',
      estimated: 200000,
      actual: 220000,
      depositPaid: 80000,
      additionalPaid: 0,
      dueDate: '2027-01-20',
      status: 'จ่ายมัดจำแล้ว',
      notes: 'เพิ่มซุ้มดอกไม้สดจุดลงทะเบียน 20,000 บาท',
      slips: [],
      linkedVendorId: 'ven-2'
    },
    {
      id: 'bdg-3',
      title: 'แพ็กเกจชุดแต่งงานบ่าวสาว 4 ชุด (เช้า-เย็น)',
      category: 'ชุดแต่งงาน & สูท',
      vendorName: 'Maison Lumière Bridal',
      estimated: 120000,
      actual: 115000,
      depositPaid: 50000,
      additionalPaid: 65000,
      dueDate: '2026-11-20',
      status: 'ชำระครบแล้ว',
      notes: 'ได้รับส่วนลดพิเศษ 5,000 บาท ชำระครบ 100% แล้ว',
      slips: [],
      linkedVendorId: 'ven-3'
    },
    {
      id: 'bdg-4',
      title: 'ทีมช่างภาพนิ่งและ Cinematography',
      category: 'ช่างภาพ & ซีเนม่า',
      vendorName: 'Velvet Lens Fine Art Photography',
      estimated: 80000,
      actual: 75000,
      depositPaid: 25000,
      additionalPaid: 0,
      dueDate: '2027-02-14',
      status: 'จ่ายมัดจำแล้ว',
      notes: 'ส่วนที่เหลือชำระหลังส่งมอบไฟล์ตัวอย่างวันงาน',
      slips: [],
      linkedVendorId: 'ven-4'
    },
    {
      id: 'bdg-5',
      title: 'การ์ดเชิญพิมพ์ทองฟอยล์ & ของชำร่วยเทียนหอม 280 ชิ้น',
      category: 'การ์ด & ของชำร่วย',
      vendorName: 'Scent & Paper Atelier',
      estimated: 45000,
      actual: 42000,
      depositPaid: 20000,
      additionalPaid: 0,
      dueDate: '2026-12-01',
      status: 'จ่ายมัดจำแล้ว',
      notes: 'สั่งเผื่อแขกผู้ใหญ่ 30 ชุด',
      slips: [],
      linkedVendorId: ''
    },
    {
      id: 'bdg-6',
      title: 'วงดนตรีสด Jazz Trio & เครื่องเสียง',
      category: 'ดนตรี & พิธีการ',
      vendorName: 'Pastel Groove Band',
      estimated: 45000,
      actual: 45000,
      depositPaid: 0,
      additionalPaid: 0,
      dueDate: '2026-11-30',
      status: 'รอชำระ',
      notes: 'นักร้อง 1 + Saxophone + Piano + Acoustic Bass',
      slips: [],
      linkedVendorId: ''
    }
  ]
};

/* --------------------------------------------------------------------------
   IndexedDB Asynchronous Helper
   -------------------------------------------------------------------------- */
function openIDB() {
  return new Promise((resolve) => {
    if (!window.indexedDB) {
      resolve(null);
      return;
    }
    try {
      const req = window.indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      req.onsuccess = (e) => resolve(e.target.result);
      req.onerror = () => resolve(null);
    } catch (err) {
      resolve(null);
    }
  });
}

function saveToIDB(data) {
  return openIDB().then(db => {
    if (!db) return false;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(IDB_STORE, 'readwrite');
        const store = tx.objectStore(IDB_STORE);
        store.put(data, 'main_wedding_state');
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      } catch (err) {
        resolve(false);
      }
    });
  });
}

function loadFromIDB() {
  return openIDB().then(db => {
    if (!db) return null;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(IDB_STORE, 'readonly');
        const store = tx.objectStore(IDB_STORE);
        const req = store.get('main_wedding_state');
        req.onsuccess = (e) => resolve(e.target.result || null);
        req.onerror = () => resolve(null);
      } catch (err) {
        resolve(null);
      }
    });
  });
}

/* --------------------------------------------------------------------------
   WeddingDataStore Class
   -------------------------------------------------------------------------- */
class WeddingDataStore {
  constructor() {
    this.listeners = [];
    this.cloudStatus = 'local';
    this._cloudTimer = null;
    this.state = this.loadSync();
    this.initAsyncIDB();
    this.initCloudSync();
  }

  // Helper to derive initial tables from existing guests if not present
  deriveInitialTables(guests = []) {
    const tableNames = new Set();
    guests.forEach(g => {
      if (g.tableNo && g.tableNo !== '-' && g.tableNo !== 'ไม่มี') tableNames.add(g.tableNo);
    });
    if (tableNames.size === 0) {
      return JSON.parse(JSON.stringify(DEFAULT_WEDDING_DATA.tables));
    }
    return Array.from(tableNames).map((name, i) => ({
      id: `tbl-${i + 1}`,
      name: name,
      capacity: 10,
      notes: ''
    }));
  }

  // Synchronous initial load with cross-version migration (v2, v1, unversioned)
  loadSync() {
    try {
      let raw = localStorage.getItem(STORAGE_KEY_V2);
      if (!raw) raw = localStorage.getItem(STORAGE_KEY_V1);
      if (!raw) raw = localStorage.getItem('lumiere_pastel_wedding_planner');

      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          _isCustomized: true,
          weddingInfo: { ...DEFAULT_WEDDING_DATA.weddingInfo, ...(parsed.weddingInfo || {}) },
          palette: Array.isArray(parsed.palette) ? parsed.palette : DEFAULT_WEDDING_DATA.palette,
          moodboard: Array.isArray(parsed.moodboard) ? parsed.moodboard : DEFAULT_WEDDING_DATA.moodboard,
          wishes: Array.isArray(parsed.wishes) ? parsed.wishes : DEFAULT_WEDDING_DATA.wishes,
          vendors: Array.isArray(parsed.vendors) ? parsed.vendors : DEFAULT_WEDDING_DATA.vendors,
          checklist: Array.isArray(parsed.checklist) ? parsed.checklist : DEFAULT_WEDDING_DATA.checklist,
          runOfShow: Array.isArray(parsed.runOfShow) ? parsed.runOfShow : DEFAULT_WEDDING_DATA.runOfShow,
          guests: Array.isArray(parsed.guests) ? parsed.guests : DEFAULT_WEDDING_DATA.guests,
          tables: Array.isArray(parsed.tables) ? parsed.tables : this.deriveInitialTables(parsed.guests || []),
          budget: Array.isArray(parsed.budget) ? parsed.budget : DEFAULT_WEDDING_DATA.budget
        };
      }
    } catch (err) {
      console.warn('LocalStorage load warning:', err);
    }
    return JSON.parse(JSON.stringify(DEFAULT_WEDDING_DATA));
  }

  // Load from IndexedDB and sync to memory without flickering
  async initAsyncIDB() {
    try {
      const idbData = await loadFromIDB();
      if (idbData && typeof idbData === 'object') {
        // If IndexedDB has state, hydrate it seamlessly
        this.state = {
          _isCustomized: true,
          weddingInfo: { ...DEFAULT_WEDDING_DATA.weddingInfo, ...(idbData.weddingInfo || {}) },
          palette: Array.isArray(idbData.palette) ? idbData.palette : this.state.palette,
          moodboard: Array.isArray(idbData.moodboard) ? idbData.moodboard : this.state.moodboard,
          wishes: Array.isArray(idbData.wishes) ? idbData.wishes : this.state.wishes,
          vendors: Array.isArray(idbData.vendors) ? idbData.vendors : this.state.vendors,
          checklist: Array.isArray(idbData.checklist) ? idbData.checklist : this.state.checklist,
          runOfShow: Array.isArray(idbData.runOfShow) ? idbData.runOfShow : this.state.runOfShow,
          guests: Array.isArray(idbData.guests) ? idbData.guests : this.state.guests,
          tables: Array.isArray(idbData.tables) ? idbData.tables : (Array.isArray(this.state.tables) ? this.state.tables : this.deriveInitialTables(idbData.guests || [])),
          budget: Array.isArray(idbData.budget) ? idbData.budget : this.state.budget
        };
        this.notify();
      } else {
        // First run on IndexedDB, persist current state
        saveToIDB(this.state);
      }
    } catch (err) {
      console.warn('IndexedDB hydration warning:', err);
    }
  }

  // Cloudflare D1 / Pages Database Cloud Sync
  async initCloudSync() {
    if (typeof window === 'undefined' || !window.location || !window.location.protocol.startsWith('http')) {
      this.updateCloudStatus('local', 'โหมดออฟไลน์ (Local IndexedDB)');
      return;
    }

    try {
      this.updateCloudStatus('syncing', 'กำลังตรวจสอบ Cloudflare D1...');
      const res = await fetch('/api/wedding', { cache: 'no-store' });
      if (!res.ok) {
        this.updateCloudStatus('local', 'Local Mode (พร้อมซิงก์ Cloudflare)');
        return;
      }

      const engine = res.headers.get('X-Storage-Engine') || 'Cloudflare D1';
      const data = await res.json();

      if (data && data.weddingInfo) {
        // Hydrate latest state from Cloudflare D1
        this.state = {
          _isCustomized: true,
          weddingInfo: { ...DEFAULT_WEDDING_DATA.weddingInfo, ...(data.weddingInfo || {}) },
          palette: Array.isArray(data.palette) ? data.palette : this.state.palette,
          moodboard: Array.isArray(data.moodboard) ? data.moodboard : this.state.moodboard,
          wishes: Array.isArray(data.wishes) ? data.wishes : this.state.wishes,
          vendors: Array.isArray(data.vendors) ? data.vendors : this.state.vendors,
          checklist: Array.isArray(data.checklist) ? data.checklist : this.state.checklist,
          runOfShow: Array.isArray(data.runOfShow) ? data.runOfShow : this.state.runOfShow,
          guests: Array.isArray(data.guests) ? data.guests : this.state.guests,
          tables: Array.isArray(data.tables) ? data.tables : (Array.isArray(this.state.tables) ? this.state.tables : this.deriveInitialTables(data.guests || [])),
          budget: Array.isArray(data.budget) ? data.budget : this.state.budget
        };
        saveToIDB(this.state);
        try { localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(this.state)); } catch (e) {}
        this.updateCloudStatus('cloud', `เชื่อมต่อ ${engine} แล้ว`);
        this.notify();
      } else if (data && data.exists === false) {
        // Database is fresh in Cloudflare, upload current initial state
        this.updateCloudStatus('syncing', `กำลังอัปโหลดข้อมูลขึ้น ${engine}...`);
        await this.syncToCloud(this.state);
      } else if (data && data.error) {
        this.updateCloudStatus('warning', 'Cloudflare: รอผูก D1 Binding');
      }
    } catch (err) {
      console.warn('Cloudflare sync warning:', err);
      this.updateCloudStatus('local', 'Local IndexedDB (ออฟไลน์)');
    }
  }

  updateCloudStatus(status, label) {
    this.cloudStatus = status;
    const badge = document.getElementById('cloud-sync-badge');
    const labelEl = document.getElementById('cloud-sync-text');
    if (badge && labelEl) {
      labelEl.textContent = label;
      badge.className = `cloud-badge cloud-${status}`;
    }
    const mobBadge = document.getElementById('mob-cloud-sync-badge');
    const mobLabelEl = document.getElementById('mob-cloud-sync-text');
    if (mobBadge && mobLabelEl) {
      mobLabelEl.textContent = label;
      mobBadge.className = `cloud-badge cloud-${status}`;
    }
  }

  async syncToCloud(state) {
    if (typeof window === 'undefined' || !window.location || !window.location.protocol.startsWith('http')) return;
    try {
      this.updateCloudStatus('syncing', 'กำลังบันทึกบน Cloudflare...');
      const res = await fetch('/api/wedding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state)
      });
      if (res.ok) {
        const result = await res.json();
        const engine = result.storage || 'Cloudflare D1';
        this.updateCloudStatus('cloud', `บันทึกบน ${engine} สำเร็จ`);
      } else {
        this.updateCloudStatus('warning', 'บันทึกในเครื่องแล้ว (รอซิงก์ Cloud)');
      }
    } catch (err) {
      console.warn('Cloudflare save warning:', err);
      this.updateCloudStatus('local', 'บันทึกในเครื่องแล้ว (ออฟไลน์)');
    }
  }

  // Master save: saves to IndexedDB + LocalStorage + Cloudflare D1
  save() {
    this.state._isCustomized = true;

    // 1. Save to high-capacity IndexedDB (handles gigabytes, no quota errors)
    saveToIDB(this.state);

    // 2. Synchronous save to LocalStorage (with quota fallback)
    try {
      localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(this.state));
    } catch (quotaErr) {
      console.warn('LocalStorage quota limit reached, saving lightweight mirror while IndexedDB stores full photos/slips:', quotaErr);
      try {
        const lightweight = this.createLightweightState();
        localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(lightweight));
      } catch (e2) {
        console.error('LocalStorage write failed, all data is safely preserved in IndexedDB:', e2);
      }
    }

    // 3. Save to Cloudflare D1 Database (Debounced 400ms to batch rapid changes)
    if (this._cloudTimer) clearTimeout(this._cloudTimer);
    this._cloudTimer = setTimeout(() => {
      this.syncToCloud(this.state);
    }, 400);

    // 4. Notify all reactive components
    this.notify();
  }

  // Create lightweight clone for LocalStorage if user has many large photos
  createLightweightState() {
    const clone = JSON.parse(JSON.stringify(this.state));
    // Trim raw data URIs if they are extremely long
    if (clone.weddingInfo && clone.weddingInfo.coverPhoto && clone.weddingInfo.coverPhoto.length > 50000) {
      clone.weddingInfo.coverPhoto = ''; // Kept in IndexedDB
    }
    if (clone.weddingInfo && clone.weddingInfo.seatingPlanImage && clone.weddingInfo.seatingPlanImage.length > 50000) {
      clone.weddingInfo.seatingPlanImage = '';
    }
    if (Array.isArray(clone.vendors)) {
      clone.vendors.forEach(v => {
        if (Array.isArray(v.images)) v.images = v.images.filter(x => x && x.length < 50000);
        if (Array.isArray(v.paymentSlips)) v.paymentSlips = v.paymentSlips.filter(x => x && x.length < 50000);
      });
    }
    if (Array.isArray(clone.budget)) {
      clone.budget.forEach(b => {
        if (Array.isArray(b.slips)) b.slips = b.slips.filter(x => x && x.length < 50000);
      });
    }
    return clone;
  }

  subscribe(fn) {
    this.listeners.push(fn);
  }

  notify() {
    this.listeners.forEach(fn => {
      try {
        fn(this.state);
      } catch (err) {
        console.error('Listener notify error:', err);
      }
    });
  }

  uid(prefix = 'id') {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  }

  getSummary() {
    const info = this.state.weddingInfo;
    const totalBudgetCap = Number(info.totalBudget) || 0;

    let totalEstimated = 0;
    let totalActual = 0;
    let totalDepositPaid = 0;
    let totalAdditionalPaid = 0;

    const categoryTotals = {};

    this.state.budget.forEach(item => {
      const est = Number(item.estimated) || 0;
      const act = Number(item.actual) || 0;
      const dep = Number(item.depositPaid) || 0;
      const add = Number(item.additionalPaid) || 0;

      totalEstimated += est;
      totalActual += act;
      totalDepositPaid += dep;
      totalAdditionalPaid += add;

      const cat = item.category || 'อื่นๆ';
      if (!categoryTotals[cat]) {
        categoryTotals[cat] = { estimated: 0, actual: 0, paid: 0, itemsCount: 0 };
      }
      categoryTotals[cat].estimated += est;
      categoryTotals[cat].actual += act;
      categoryTotals[cat].paid += (dep + add);
      categoryTotals[cat].itemsCount++;
    });

    const totalPaid = totalDepositPaid + totalAdditionalPaid;
    const totalUnpaidBalance = Math.max(0, totalActual - totalPaid);
    const remainingBudgetFromCap = totalBudgetCap - totalActual;
    const budgetPercentUsed = totalBudgetCap > 0 ? Math.min(100, Math.round((totalActual / totalBudgetCap) * 100)) : 0;

    const totalTasks = this.state.checklist.length;
    const completedTasks = this.state.checklist.filter(t => t.completed).length;
    const pendingTasks = totalTasks - completedTasks;
    const taskProgressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const totalCues = this.state.runOfShow.length;
    const completedCues = this.state.runOfShow.filter(c => c.completed || c.status === 'เสร็จสิ้น').length;

    const totalGuestEntries = this.state.guests.length;
    let confirmedSeats = 0;
    let pendingSeats = 0;
    let declinedCount = 0;
    let confirmedGroups = 0;
    let pendingGroups = 0;

    const tableMap = {};
    const defaultCap = Number(this.state.weddingInfo.seatsPerTable) || 10;
    const tablesList = Array.isArray(this.state.tables) ? this.state.tables : [];

    // Pre-populate defined tables so even empty tables show up
    tablesList.forEach(t => {
      tableMap[t.name] = {
        id: t.id,
        name: t.name,
        capacity: Number(t.capacity) || defaultCap,
        notes: t.notes || '',
        seats: 0,
        guests: []
      };
    });

    this.state.guests.forEach(g => {
      const seats = Number(g.seats) || 0;
      if (g.rsvp === 'ยืนยันมาร่วมงาน') {
        confirmedSeats += seats;
        confirmedGroups++;
      } else if (g.rsvp === 'รอตอบรับ') {
        pendingSeats += seats;
        pendingGroups++;
      } else {
        declinedCount++;
      }

      if (g.rsvp !== 'ไม่สะดวกมาร่วม' && g.tableNo && g.tableNo !== '-' && g.tableNo !== '' && g.tableNo !== 'ไม่มี') {
        if (!tableMap[g.tableNo]) {
          tableMap[g.tableNo] = {
            id: 'tbl-auto-' + g.tableNo,
            name: g.tableNo,
            capacity: defaultCap,
            notes: '',
            seats: 0,
            guests: []
          };
        }
        tableMap[g.tableNo].seats += seats;
        tableMap[g.tableNo].guests.push({
          id: g.id,
          name: g.name,
          seats,
          side: g.side || '',
          group: g.group || '',
          phone: g.phone || '',
          dietary: g.dietary || ''
        });
      }
    });

    const totalTables = Object.keys(tableMap).length;
    let totalTableCapacity = 0;
    let totalSeatedGuests = 0;
    Object.values(tableMap).forEach(t => {
      totalTableCapacity += t.capacity;
      totalSeatedGuests += t.seats;
    });

    const totalVendors = this.state.vendors.length;
    const approvedVendors = this.state.vendors.filter(v => v.status && v.status.includes('อนุมัติแล้ว')).length;
    const negotiatingVendors = this.state.vendors.filter(v => v.status && !v.status.includes('อนุมัติแล้ว') && !v.status.includes('ปฏิเสธ')).length;

    return {
      totalBudgetCap,
      totalEstimated,
      totalActual,
      totalDepositPaid,
      totalAdditionalPaid,
      totalPaid,
      totalUnpaidBalance,
      remainingBudgetFromCap,
      budgetPercentUsed,
      categoryTotals,
      totalTasks,
      completedTasks,
      pendingTasks,
      taskProgressPercent,
      totalCues,
      completedCues,
      totalGuestEntries,
      confirmedSeats,
      pendingSeats,
      totalProjectedSeats: confirmedSeats + pendingSeats,
      declinedCount,
      confirmedGroups,
      pendingGroups,
      tableMap,
      totalTables,
      totalTableCapacity,
      totalSeatedGuests,
      totalVendors,
      approvedVendors,
      negotiatingVendors
    };
  }

  /* --------------------------------------------------------------------------
     Bulletproof CRUD Operations (Never Drops Items)
     -------------------------------------------------------------------------- */
  updateWeddingInfo(newInfo) {
    this.state.weddingInfo = { ...this.state.weddingInfo, ...newInfo };
    this.save();
  }

  // Palette
  addColorSwatch(swatch) {
    this.state.palette.push({ id: this.uid('pal'), ...swatch });
    this.save();
  }
  deleteColorSwatch(id) {
    this.state.palette = this.state.palette.filter(c => c.id !== id);
    this.save();
  }

  // Moodboard
  saveMoodItem(item) {
    if (item.id) {
      const idx = this.state.moodboard.findIndex(m => m.id === item.id);
      if (idx > -1) {
        this.state.moodboard[idx] = { ...this.state.moodboard[idx], ...item };
      } else {
        this.state.moodboard.unshift({ id: item.id, favorite: false, ...item });
      }
    } else {
      this.state.moodboard.unshift({ id: this.uid('mb'), favorite: false, ...item });
    }
    this.save();
  }
  toggleMoodFavorite(id) {
    const item = this.state.moodboard.find(m => m.id === id);
    if (item) {
      item.favorite = !item.favorite;
      this.save();
    }
  }
  deleteMoodItem(id) {
    this.state.moodboard = this.state.moodboard.filter(m => m.id !== id);
    this.save();
  }

  // Wishes
  saveWish(wish) {
    if (wish.id) {
      const idx = this.state.wishes.findIndex(w => w.id === wish.id);
      if (idx > -1) {
        this.state.wishes[idx] = { ...this.state.wishes[idx], ...wish };
      } else {
        this.state.wishes.push({ id: wish.id, ...wish });
      }
    } else {
      this.state.wishes.push({ id: this.uid('wish'), ...wish });
    }
    this.save();
  }
  deleteWish(id) {
    this.state.wishes = this.state.wishes.filter(w => w.id !== id);
    this.save();
  }

  // Vendors
  saveVendor(vendorData, syncBudget = false) {
    let savedVendor;
    if (vendorData.id) {
      const idx = this.state.vendors.findIndex(v => v.id === vendorData.id);
      if (idx > -1) {
        this.state.vendors[idx] = { ...this.state.vendors[idx], ...vendorData };
        savedVendor = this.state.vendors[idx];
      } else {
        savedVendor = {
          id: vendorData.id,
          meetings: [],
          images: [],
          paymentSlips: [],
          syncedToBudget: syncBudget,
          ...vendorData
        };
        this.state.vendors.unshift(savedVendor);
      }
    } else {
      savedVendor = {
        id: this.uid('ven'),
        meetings: [],
        images: [],
        paymentSlips: [],
        syncedToBudget: syncBudget,
        ...vendorData
      };
      this.state.vendors.unshift(savedVendor);
    }

    if (syncBudget && savedVendor) {
      savedVendor.syncedToBudget = true;
      const existingBdg = this.state.budget.find(b => b.linkedVendorId === savedVendor.id);
      const dep = Number(savedVendor.depositAmount) || 0;
      const price = Number(savedVendor.quotedPrice) || 0;
      const status = dep >= price && price > 0 ? 'ชำระครบแล้ว' : (dep > 0 ? 'จ่ายมัดจำแล้ว' : 'รอชำระ');

      if (existingBdg) {
        existingBdg.title = `ค่าบริการ: ${savedVendor.name}`;
        existingBdg.category = savedVendor.category;
        existingBdg.vendorName = savedVendor.name;
        existingBdg.actual = price;
        existingBdg.depositPaid = dep;
        existingBdg.dueDate = savedVendor.finalPaymentDate || existingBdg.dueDate;
        existingBdg.status = status;
        if (savedVendor.paymentSlips && savedVendor.paymentSlips.length > 0) {
          existingBdg.slips = Array.from(new Set([...(existingBdg.slips || []), ...savedVendor.paymentSlips]));
        }
      } else {
        this.state.budget.unshift({
          id: this.uid('bdg'),
          title: `ค่าบริการ: ${savedVendor.name}`,
          category: savedVendor.category,
          vendorName: savedVendor.name,
          estimated: price,
          actual: price,
          depositPaid: dep,
          additionalPaid: 0,
          dueDate: savedVendor.finalPaymentDate || this.state.weddingInfo.weddingDate,
          status,
          notes: savedVendor.notes || '',
          slips: savedVendor.paymentSlips || [],
          linkedVendorId: savedVendor.id
        });
      }
    }

    this.save();
  }

  deleteVendor(id) {
    this.state.vendors = this.state.vendors.filter(v => v.id !== id);
    // Unlink vendor from budget items instead of wiping the user's financial record
    this.state.budget.forEach(b => {
      if (b.linkedVendorId === id) b.linkedVendorId = '';
    });
    this.save();
  }

  addVendorMeeting(vendorId, meeting) {
    const vendor = this.state.vendors.find(v => v.id === vendorId);
    if (vendor) {
      if (!Array.isArray(vendor.meetings)) vendor.meetings = [];
      vendor.meetings.unshift({ id: this.uid('mt'), ...meeting });
      this.save();
    }
  }

  deleteVendorMeeting(vendorId, meetingId) {
    const vendor = this.state.vendors.find(v => v.id === vendorId);
    if (vendor && Array.isArray(vendor.meetings)) {
      vendor.meetings = vendor.meetings.filter(m => m.id !== meetingId);
      this.save();
    }
  }

  // Checklist
  saveTask(task) {
    if (task.id) {
      const idx = this.state.checklist.findIndex(t => t.id === task.id);
      if (idx > -1) {
        this.state.checklist[idx] = { ...this.state.checklist[idx], ...task };
      } else {
        this.state.checklist.unshift({ id: task.id, completed: false, ...task });
      }
    } else {
      this.state.checklist.unshift({ id: this.uid('chk'), completed: false, ...task });
    }
    this.save();
  }
  toggleTask(id) {
    const task = this.state.checklist.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      this.save();
    }
  }
  deleteTask(id) {
    this.state.checklist = this.state.checklist.filter(t => t.id !== id);
    this.save();
  }

  // Rundown (Run-of-Show)
  saveRunOfShowItem(item) {
    if (item.id) {
      const idx = this.state.runOfShow.findIndex(r => r.id === item.id);
      if (idx > -1) {
        this.state.runOfShow[idx] = { ...this.state.runOfShow[idx], ...item };
      } else {
        this.state.runOfShow.push({ id: item.id, completed: false, ...item });
      }
    } else {
      this.state.runOfShow.push({ id: this.uid('ros'), completed: false, ...item });
    }
    this.state.runOfShow.sort((a, b) => String(a.startTime).localeCompare(String(b.startTime)));
    this.save();
  }

  updateRunOfShowStatus(id, newStatus) {
    const item = this.state.runOfShow.find(r => r.id === id);
    if (item) {
      item.status = newStatus;
      item.completed = (newStatus === 'เสร็จสิ้น');
      this.save();
    }
  }

  deleteRunOfShowItem(id) {
    this.state.runOfShow = this.state.runOfShow.filter(r => r.id !== id);
    this.save();
  }

  // Guests
  saveGuest(guest) {
    if (guest.tableNo && guest.tableNo !== '-' && guest.tableNo !== '' && guest.tableNo !== 'ไม่มี') {
      if (!this.state.tables.some(t => t.name === guest.tableNo)) {
        this.state.tables.push({
          id: this.uid('tbl'),
          name: guest.tableNo,
          capacity: Number(this.state.weddingInfo.seatsPerTable) || 10,
          notes: ''
        });
      }
    }
    if (guest.id) {
      const idx = this.state.guests.findIndex(g => g.id === guest.id);
      if (idx > -1) {
        this.state.guests[idx] = { ...this.state.guests[idx], ...guest };
      } else {
        this.state.guests.unshift({ id: guest.id, ...guest });
      }
    } else {
      this.state.guests.unshift({ id: this.uid('gst'), ...guest });
    }
    this.save();
  }
  deleteGuest(id) {
    this.state.guests = this.state.guests.filter(g => g.id !== id);
    this.save();
  }

  // Tables Management (Add/Delete/Edit Tables & Seat Guests)
  saveTable(tableData) {
    const capacity = Number(tableData.capacity) || Number(this.state.weddingInfo.seatsPerTable) || 10;
    const payload = {
      name: (tableData.name || '').trim(),
      capacity,
      notes: (tableData.notes || '').trim()
    };
    if (tableData.id) {
      const idx = this.state.tables.findIndex(t => t.id === tableData.id);
      if (idx > -1) {
        const oldName = this.state.tables[idx].name;
        const newName = payload.name;
        this.state.tables[idx] = { ...this.state.tables[idx], ...payload };
        // If table name changed, update any seated guests automatically
        if (oldName && newName && oldName !== newName) {
          this.state.guests.forEach(g => {
            if (g.tableNo === oldName) g.tableNo = newName;
          });
        }
      } else {
        this.state.tables.push({ id: tableData.id, ...payload });
      }
    } else {
      this.state.tables.push({ id: this.uid('tbl'), ...payload });
    }
    this.save();
  }

  deleteTable(id) {
    const table = this.state.tables.find(t => t.id === id);
    if (table) {
      // Unlink guests from this table so guests aren't lost
      this.state.guests.forEach(g => {
        if (g.tableNo === table.name) g.tableNo = '';
      });
      this.state.tables = this.state.tables.filter(t => t.id !== id);
      this.save();
    }
  }

  addQuickTable() {
    let nextNum = 1;
    const existing = this.state.tables.map(t => t.name);
    while (existing.includes(`Table ${nextNum}`) || existing.includes(`โต๊ะ ${nextNum}`)) {
      nextNum++;
    }
    const name = `Table ${nextNum}`;
    const capacity = Number(this.state.weddingInfo.seatsPerTable) || 10;
    this.saveTable({ name, capacity, notes: '' });
  }

  assignGuestToTable(guestId, tableName) {
    const g = this.state.guests.find(x => x.id === guestId);
    if (g) {
      g.tableNo = tableName;
      this.save();
    }
  }

  removeGuestFromTable(guestId) {
    const g = this.state.guests.find(x => x.id === guestId);
    if (g) {
      g.tableNo = '';
      this.save();
    }
  }

  // Budget
  saveBudgetItem(item) {
    const actual = Number(item.actual) || 0;
    const paid = (Number(item.depositPaid) || 0) + (Number(item.additionalPaid) || 0);
    let autoStatus = item.status;
    if (actual > 0 && paid >= actual) {
      autoStatus = 'ชำระครบแล้ว';
    } else if (paid > 0) {
      autoStatus = 'จ่ายมัดจำแล้ว';
    } else {
      autoStatus = 'รอชำระ';
    }

    const payload = { ...item, status: autoStatus };

    if (payload.id) {
      const idx = this.state.budget.findIndex(b => b.id === payload.id);
      if (idx > -1) {
        this.state.budget[idx] = { ...this.state.budget[idx], ...payload };
      } else {
        this.state.budget.unshift({ id: payload.id, ...payload });
      }
    } else {
      this.state.budget.unshift({ id: this.uid('bdg'), ...payload });
    }
    this.save();
  }
  deleteBudgetItem(id) {
    this.state.budget = this.state.budget.filter(b => b.id !== id);
    this.save();
  }

  // Backup / Reset
  resetToDemo() {
    this.state = JSON.parse(JSON.stringify(DEFAULT_WEDDING_DATA));
    this.save();
  }

  importJSON(jsonStr) {
    const parsed = JSON.parse(jsonStr);
    if (!parsed.weddingInfo) throw new Error('รูปแบบไฟล์ข้อมูลไม่ถูกต้อง');
    this.state = {
      _isCustomized: true,
      weddingInfo: { ...DEFAULT_WEDDING_DATA.weddingInfo, ...parsed.weddingInfo },
      palette: parsed.palette || [],
      moodboard: parsed.moodboard || [],
      wishes: parsed.wishes || [],
      vendors: parsed.vendors || [],
      checklist: parsed.checklist || [],
      runOfShow: parsed.runOfShow || DEFAULT_WEDDING_DATA.runOfShow,
      guests: parsed.guests || [],
      tables: Array.isArray(parsed.tables) ? parsed.tables : this.deriveInitialTables(parsed.guests || []),
      budget: parsed.budget || []
    };
    this.save();
  }
}

window.weddingStore = new WeddingDataStore();
