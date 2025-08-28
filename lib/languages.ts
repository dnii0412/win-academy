export const languages = {
  en: "English",
  mn: "Монгол",
} as const

export type Language = keyof typeof languages

export const translations = {
  en: {
    // Navigation
    nav: {
      home: "Home",
      courses: "Courses",
      login: "Login",
      register: "Register",
      dashboard: "Dashboard",
      profile: "Profile",
      settings: "Settings",
      logout: "Logout",
      careers: "Careers",
    },
    // Home page
    home: {
      hero: {
        title: "Learn. Create. Get Hired.",
        subtitle: "Empower yourself with practical digital skills in marketing, design, and AI. Join Mongolia's premier academy for digital professionals.",
        motto: "Digital marketing, sales, graphic design, artificial intelligence's most innovative programs",
        studentsHired: "Students Hired:",
        startLearning: "Start Learning Today",
        viewCourses: "View All Courses",
      },
      courses: {
        title: "Featured Courses",
        subtitle: "Start your journey with our most popular programs",
        viewAll: "View All Courses",
      },
      benefits: {
        title: "Why Win Academy?",
        subtitle: "Built for Mongolia's digital future",
        skills: {
          title: "Skills that Matter",
          description: "Courses designed for real-world jobs in Mongolia's growing digital economy.",
        },
        growth: {
          title: "Faster Growth",
          description: "Learn, practice, and get hired quickly with our accelerated learning approach.",
        },
        ai: {
          title: "Powered by AI",
          description: "Stay ahead with cutting-edge AI tools and techniques integrated into every course.",
        },
      },
      testimonials: {
        title: "Success Stories",
        subtitle: "Hear from our graduates who transformed their careers",
        batbayar: {
          role: "Digital Marketing Specialist",
          content: "Win Academy helped me land my dream job at a top marketing agency. The practical skills I learned were exactly what employers were looking for.",
        },
        oyunaa: {
          role: "Freelance Designer",
          content: "The UI/UX course transformed my career. I went from zero design experience to earning ₮2M+ monthly as a freelancer.",
        },
        munkh: {
          role: "AI Consultant",
          content: "The AI tools course gave me the edge I needed. Now I help businesses automate their processes and increase efficiency.",
        },
      },
      contact: {
        title: "Get in Touch",
        subtitle: "Ready to start your digital transformation? Contact us today.",
        location: "Pearl Tower B Corpus",
        floor: "11th Floor, Room 1101",
        city: "Ulaanbaatar, Mongolia",
        phone: "9016-6060, 9668-0707",
        email: "hello@winacademy.mn",
      },
    },
    // Courses page
    courses: {
      title: "All Courses",
      subtitle: "Choose from online and on-site courses",
      search: "Search courses...",
      filter: "Filter by modality",
      online: "Online",
      onsite: "On-site",
      hybrid: "Hybrid",
      all: "All",
      coursesFound: "courses found",
      onlineCourses: "Online courses",
      onsiteCourses: "On-site courses",
      previous: "Previous",
      next: "Next",
    },
    // Course cards
    courseCard: {
      enrollNow: "Enroll Now",
      continue: "Continue",
      duration: "Duration",
      instructor: "Instructor",
      schedule: "Schedule",
    },
    // Auth pages
    auth: {
      login: {
        title: "Welcome Back",
        subtitle: "Sign in to your account to continue learning",
        email: "Email Address",
        password: "Password",
        rememberMe: "Remember me",
        forgotPassword: "Forgot your password?",
        signIn: "Sign In",
        googleSignIn: "Continue with Google",
        noAccount: "Don't have an account?",
        signUp: "Sign up",
        or: "Or continue with email",
      },
      register: {
        title: "Create Account",
        subtitle: "Join WIN Academy and start your digital journey",
        fullName: "Full Name",
        email: "Email Address",
        phone: "Phone Number",
        password: "Password",
        confirmPassword: "Confirm Password",
        agreeToTerms: "I agree to the Terms and Conditions and Privacy Policy",
        terms: "Terms and Conditions",
        privacy: "Privacy Policy",
        createAccount: "Create Account",
        googleSignUp: "Continue with Google",
        or: "Or continue with email",
        haveAccount: "Already have an account?",
        signIn: "Sign in",
      },
    },
    // Checkout
    checkout: {
      title: "Checkout Information",
      orderSummary: "Order Summary",
      contactInfo: "Contact Information",
      paymentMethod: "Payment Method",
      qpay: "QPay (Mobile Payment)",
      byl: "BYL (Bank Transfer)",
      terms: "I agree to the Terms and Conditions and Privacy Policy",
      pay: "Pay",
      processing: "Processing...",
    },
    // Payment
    payment: {
      success: {
        title: "Payment Successful!",
        description: "Your enrollment has been confirmed. You can now access your course.",
        goToDashboard: "Go to Dashboard",
        tryAgain: "Try Again",
        backToHome: "Back to Home",
        autoUpdate: "This page will automatically update when your payment is processed.",
      },
      pending: {
        title: "Payment Pending",
        description: "Your payment is being processed. This may take a few minutes.",
      },
      failed: {
        title: "Payment Failed",
        description: "Your payment could not be processed. Please try again or contact support.",
      },
      cancelled: {
        title: "Payment Cancelled",
        description: "Your payment was cancelled. You can try again or choose a different payment method.",
      },
    },
    // Common
    common: {
      loading: "Loading...",
      error: "Error",
      success: "Success",
      cancel: "Cancel",
      save: "Save",
      edit: "Edit",
      delete: "Delete",
      back: "Back",
      next: "Next",
      submit: "Submit",
      close: "Close",
    },
  },
  mn: {
    // Navigation
    nav: {
      home: "Нүүр",
      courses: "Сургалтууд",
      login: "Нэвтрэх",
      register: "Бүртгүүлэх",
      dashboard: "Удирдлага",
      profile: "Профайл",
      settings: "Тохиргоо",
      logout: "Гарах",
      careers: "Карьер",
    },
    // Home page
    home: {
      hero: {
        title: "Сур. Үүсгэ. Ажилд ор.",
        subtitle: "Маркетинг, дизайн, AI-ийн практик ур чадвараар өөрийгөө хөгжүүл. Монголын тэргүүлэгч дижитал мэргэжлийн академид нэгдээрэй.",
        motto: "Дижитал маркетинг, борлуулалт, график дизайн, хиймэл оюуны хамгийн шинэлэг хөтөлбөрүүд",
        studentsHired: "Ажилд орсон сурагчид:",
        startLearning: "Өнөөдөр суралцаж эхлээрэй",
        viewCourses: "Бүх сургалтыг харах",
      },
      courses: {
        title: "Онцлох сургалтууд",
        subtitle: "Хамгийн алдартай хөтөлбөрүүдээрээ аялалаа эхлээрэй",
        viewAll: "Бүх сургалтыг харах",
      },
      benefits: {
        title: "Яагаад WIN Academy?",
        subtitle: "Монголын дижитал ирээдүйн төлөө бүтээгдсэн",
        skills: {
          title: "Чухал ур чадварууд",
          description: "Монголын хөгжиж буй дижитал эдийн засгийн бодит ажлын байрны төлөө зориулсан сургалтууд.",
        },
        growth: {
          title: "Хурдан хөгжил",
          description: "Манай хурдасгасан сургалтын аргаар суралцаж, дадлага хийж, хурдан ажилд орно уу.",
        },
        ai: {
          title: "AI-аар хөгжсөн",
          description: "Бүх сургалтад нэгтгэгдсэн дэлгээний AI хэрэгслүүд, арга техникээр урьдчилж байна уу.",
        },
      },
      testimonials: {
        title: "Амжилтын түүхүүд",
        subtitle: "Карьераа өөрчилсөн төгсөгчдийнхээ түүхийг сонсоорой",
        batbayar: {
          role: "Дижитал маркетингийн мэргэжилтэн",
          content: "WIN Academy надад дээд зэргийн маркетингийн агентлагт мөрөөдлийн ажлыг олход тусалсан. Би сурсан практик ур чадварууд нь ажил олгогчдын хайж байсан зүйл байсан.",
        },
        oyunaa: {
          role: "Чөлөөт дизайнер",
          content: "UI/UX сургалт нь миний карьерыг өөрчилсөн. Би тэг дизайн туршлагатай байснаас сая ₮2M+ сарын орлоготой чөлөөт дизайнер болсон.",
        },
        munkh: {
          role: "AI зөвлөгч",
          content: "AI хэрэгслүүдийн сургалт надад шаардлагатай давуу талыг өгсөн. Одоо би бизнесүүдэд үйл явцыг автоматжуулж, үр ашгийг нэмэгдүүлэхэд тусалдаг.",
        },
      },
      contact: {
        title: "Холбоо барих",
        subtitle: "",
        location: "Pearl Tower B Corpus",
        floor: "11 давхарт 1101 тоот",
        city: "Улаанбаатар, Монгол",
        phone: "9016-6060, 9668-0707",
        email: "hello@winacademy.mn",
      },
    },
    // Courses page
    courses: {
      title: "Бүх сургалтууд",
      subtitle: "Онлайн болон танхимын сургалтуудаас сонгоорой",
      search: "Сургалт хайх...",
      filter: "Хэлбэрээр шүүх",
      online: "Онлайн",
      onsite: "Танхим",
      hybrid: "Холимог",
      all: "Бүгд",
      coursesFound: "сургалт олдлоо",
      onlineCourses: "Онлайн сургалтууд",
      onsiteCourses: "Танхимын сургалтууд",
      previous: "Өмнөх",
      next: "Дараах",
    },
    // Course cards
    courseCard: {
      enrollNow: "Бүртгүүлэх",
      continue: "Үргэлжлүүлэх",
      duration: "Үргэлжлэх хугацаа",
      instructor: "Багш",
      schedule: "Хуваарь",
    },
    // Auth pages
    auth: {
      login: {
        title: "Сайн байна уу",
        subtitle: "Үргэлжлүүлэн суралцахын тулд бүртгэлдээ нэвтэрнэ үү",
        email: "И-мэйл хаяг",
        password: "Нууц үг",
        rememberMe: "Намайг сана",
        forgotPassword: "Нууц үгээ мартсан уу?",
        signIn: "Нэвтрэх",
        googleSignIn: "Google-аар үргэлжлүүлэх",
        noAccount: "Бүртгэл байхгүй юу?",
        signUp: "Бүртгүүлэх",
        or: "Эсвэл и-мэйлээр үргэлжлүүлэх",
      },
      register: {
        title: "Бүртгэл үүсгэх",
        subtitle: "WIN Academy-д нэгдэж, дижитал аялалаа эхлээрэй",
        fullName: "Бүтэн нэр",
        email: "И-мэйл хаяг",
        phone: "Утасны дугаар",
        password: "Нууц үг",
        confirmPassword: "Нууц үг баталгаажуулах",
        agreeToTerms: "Би Үйлчилгээний нөхцөл ба Нууцлалын бодлогод зөвшөөрч байна",
        terms: "Үйлчилгээний нөхцөл",
        privacy: "Нууцлалын бодлого",
        createAccount: "Бүртгэл үүсгэх",
        googleSignUp: "Google-аар үргэлжлүүлэх",
        or: "Эсвэл и-мэйлээр үргэлжлүүлэх",
        haveAccount: "Бүртгэл байгаа юу?",
        signIn: "Нэвтрэх",
      },
    },
    // Checkout
    checkout: {
      title: "Төлбөр төлөх мэдээлэл",
      orderSummary: "Захиалгын дүн",
      contactInfo: "Холбоо барих мэдээлэл",
      paymentMethod: "Төлбөр төлөх арга",
      qpay: "QPay (Утасны төлбөр)",
      byl: "BYL (Банкны шилжүүлэг)",
      terms: "Би Үйлчилгээний нөхцөл ба Нууцлалын бодлогод зөвшөөрч байна",
      pay: "Төлөх",
      processing: "Боловсруулж байна...",
    },
    // Payment
    payment: {
      success: {
        title: "Төлбөр амжилттай!",
        description: "Таны бүртгэл баталгаажлаа. Та одоо сургалтаа хандаж болно.",
        goToDashboard: "Удирдлага руу орох",
        tryAgain: "Дахин оролдох",
        backToHome: "Нүүр рүү буцах",
        autoUpdate: "Таны төлбөр боловсруулагдахад энэ хуудас автоматаар шинэчлэгдэнэ.",
      },
      pending: {
        title: "Төлбөр хүлээгдэж байна",
        description: "Таны төлбөр боловсруулагдаж байна. Энэ нь хэдэн минут шаардаж болно.",
      },
      failed: {
        title: "Төлбөр амжилтгүй",
        description: "Таны төлбөр боловсруулагдаагүй. Дахин оролдоно уу эсвэл дэмжлэгтэй холбогдоно уу.",
      },
      cancelled: {
        title: "Төлбөр цуцлагдсан",
        description: "Таны төлбөр цуцлагдсан. Дахин оролдоно уу эсвэл өөр төлбөр төлөх арга сонгоно уу.",
      },
    },
    // Common
    common: {
      loading: "Уншиж байна...",
      error: "Алдаа",
      success: "Амжилттай",
      cancel: "Цуцлах",
      save: "Хадгалах",
      edit: "Засах",
      delete: "Устгах",
      back: "Буцах",
      next: "Дараах",
      submit: "Илгээх",
      close: "Хаах",
    },
  },
} as const

export type TranslationKey = keyof typeof translations.en
