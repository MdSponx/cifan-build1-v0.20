import { ShortFilmProgramEntry, ProgramGroup, ShortFilmProgramFilters } from '../types/shortFilmProgram.types';

/**
 * Service for managing short film program data
 */
export class ShortFilmProgramService {
  // Static data from the CSV file
  private static readonly PROGRAM_DATA: ShortFilmProgramEntry[] = [
    { program: "Program I", title: "0.17", country: "Thailand", filmmaker: "อิทธิทร ปิยารมย์", category: "Youth Competition", runtime: "12:00" },
    { program: "Program I", title: "Another Dimension", country: "Thailand", filmmaker: "ภูเบศ คงกระพันธ์", category: "Youth Competition", runtime: "6:22" },
    { program: "Program I", title: "Cursed Voice", country: "Thailand", filmmaker: "กรณ์ดนัย ชินกร", category: "Future Competition", runtime: "8:53" },
    { program: "Program I", title: "FW(Z)B Friend with Zombie", country: "Thailand", filmmaker: "มนัสวิน หินคำ", category: "Future Competition", runtime: "13:04" },
    { program: "Program I", title: "Hydrocracy", country: "Thailand", filmmaker: "นัฐพล สังข์คำ", category: "Future Competition", runtime: "9:01" },
    { program: "Program I", title: "Barf", country: "Mexico", filmmaker: "Luis Gerardo LoGar", category: "World Competition", runtime: "11:28" },
    { program: "Program I", title: "Beopche (One who attains enlightenment)", country: "South Korea", filmmaker: "Shingyu Kang, Shinuk Kang", category: "World Competition", runtime: "5:53" },
    { program: "Program I", title: "C&Minor", country: "Thailand", filmmaker: "จักรพันธ์ ปิ่นประดับ", category: "World Competition", runtime: "10:41" },
    { program: "Program I", title: "Dressed for Dinner", country: "Italy", filmmaker: "Andrea Verardi", category: "World Competition", runtime: "9:46" },
    { program: "Program I", title: "Echoes of the Wild", country: "New Zealand", filmmaker: "Shaz Bell", category: "World Competition", runtime: "7:32" },
    
    { program: "Program II", title: "Beneath the whisper", country: "Thailand", filmmaker: "ชมพูนุท สวัสดิ์ประวิทย์", category: "Youth Competition", runtime: "11:22" },
    { program: "Program II", title: "Echoes Of Youth", country: "Thailand", filmmaker: "นาวิน บุญยิ่ง", category: "Youth Competition", runtime: "9:23" },
    { program: "Program II", title: "Midnight Whisper", country: "Thailand", filmmaker: "ปิ่นประภา เรืองนุกูล", category: "Future Competition", runtime: "9:15" },
    { program: "Program II", title: "Reflection", country: "Thailand", filmmaker: "กฤตกม โสมโสดา", category: "Future Competition", runtime: "7:08" },
    { program: "Program II", title: "The Friend's Curse", country: "Thailand", filmmaker: "นัฐพล สังข์คำ", category: "Future Competition", runtime: "8:54" },
    { program: "Program II", title: "Humus", country: "Italy", filmmaker: "Gabriele Mencaroni", category: "World Competition", runtime: "5:36" },
    { program: "Program II", title: "Immortal Divideชายแดนห่งนิรันดร์", country: "Thailand", filmmaker: "นิพันธ์ จ้าวเจริญพร", category: "World Competition", runtime: "10:00" },
    { program: "Program II", title: "In the Shadows", country: "France", filmmaker: "Jérémy Barlozzo", category: "World Competition", runtime: "9:12" },
    { program: "Program II", title: "Lost in Chiangmai", country: "Thailand", filmmaker: "Niwat odton", category: "World Competition", runtime: "9:54" },
    { program: "Program II", title: "Match", country: "Spain", filmmaker: "Victor Basallote", category: "World Competition", runtime: "8:08" },
    
    { program: "Program III", title: "Film Is Dead", country: "Thailand", filmmaker: "พลอยพิชชา เฮลล์พิน", category: "Youth Competition", runtime: "7:48" },
    { program: "Program III", title: "Just a Fri(end)", country: "Thailand", filmmaker: "นครินทร์ แพ่งศิริ", category: "Youth Competition", runtime: "9:28" },
    { program: "Program III", title: "MAMIA", country: "Thailand", filmmaker: "กัญญาณัฐ เพียรไลย์", category: "Youth Competition", runtime: "9:59" },
    { program: "Program III", title: "Reflections Across Lifetimes", country: "Thailand", filmmaker: "นัฐพล สังข์คำ", category: "Future Competition", runtime: "10:30" },
    { program: "Program III", title: "THE PROTECTOR OF THE HILLS: COWBOY-MIANG", country: "Thailand", filmmaker: "ทิวา บัวลอย", category: "Future Competition", runtime: "8:42" },
    { program: "Program III", title: "Plug In", country: "Thailand", filmmaker: "ธิติพัทธ์ ศรีสุดามหาอุทัย", category: "World Competition", runtime: "9:35" },
    { program: "Program III", title: "Project-CM2029", country: "Thailand", filmmaker: "Chaweng Chaiyawan", category: "World Competition", runtime: "5:34" },
    { program: "Program III", title: "Salamander's Land", country: "Russia", filmmaker: "Ekaterina Ulyanova", category: "World Competition", runtime: "9:00" },
    { program: "Program III", title: "Snow Void", country: "South Korea", filmmaker: "KIM Yong Gi", category: "World Competition", runtime: "10:00" },
    { program: "Program III", title: "The Last Red Car", country: "Thailand", filmmaker: "ธีรพงษ์ เกตชาลี", category: "World Competition", runtime: "9:59" },
    
    { program: "Program IV", title: "Offret", country: "Thailand", filmmaker: "ชญวัจน์ ฤทธิธมนวัจน์", category: "Youth Competition", runtime: "8:27" },
    { program: "Program IV", title: "Pusae-Yasae", country: "Thailand", filmmaker: "ทิพย์มณี นามวงษา", category: "Youth Competition", runtime: "8:10" },
    { program: "Program IV", title: "Tied by love", country: "Thailand", filmmaker: "รดา ไชยวรรณ", category: "Youth Competition", runtime: "9:50" },
    { program: "Program IV", title: "Tok Khued", country: "Thailand", filmmaker: "ธนาธร จันทร์หอม", category: "Future Competition", runtime: "12:34" },
    { program: "Program IV", title: "Where Time Blooms", country: "Thailand", filmmaker: "กฤษดา ปีกา", category: "Future Competition", runtime: "6:30" },
    { program: "Program IV", title: "The Writer's Horror", country: "Thailand", filmmaker: "Sergiy Pudich", category: "World Competition", runtime: "10:33" },
    { program: "Program IV", title: "Tornado", country: "Iran", filmmaker: "Majid Farzolahi", category: "World Competition", runtime: "5:06" },
    { program: "Program IV", title: "Uppada Thiti Bhanga", country: "Thailand", filmmaker: "ณัฐธัญ กรุงศรี", category: "World Competition", runtime: "5:21" },
    { program: "Program IV", title: "Where the Fish Looked Up", country: "Malaysia", filmmaker: "Junyu Yeo", category: "World Competition", runtime: "6:30" },
    { program: "Program IV", title: "Where The Stars Rest", country: "India", filmmaker: "Vedanga Nag", category: "World Competition", runtime: "5:10" },
    { program: "Program IV", title: "Ziggy's Show: The Curse of Mariachi Bondage", country: "Mexico", filmmaker: "Giorgio Ross", category: "World Competition", runtime: "10:46" }
  ];

  /**
   * Gets all program data
   */
  static getAllPrograms(): ShortFilmProgramEntry[] {
    return [...this.PROGRAM_DATA];
  }

  /**
   * Gets programs grouped by program name
   */
  static getProgramGroups(): ProgramGroup[] {
    const groups: { [key: string]: ShortFilmProgramEntry[] } = {};
    
    // Group films by program
    this.PROGRAM_DATA.forEach(film => {
      if (!groups[film.program]) {
        groups[film.program] = [];
      }
      groups[film.program].push(film);
    });

    // Convert to ProgramGroup array and maintain order
    const programOrder = ["Program I", "Program II", "Program III", "Program IV"];
    
    return programOrder.map(programName => ({
      program: programName,
      films: groups[programName] || [],
      count: (groups[programName] || []).length
    })).filter(group => group.count > 0);
  }

  /**
   * Gets filtered program data
   */
  static getFilteredPrograms(filters: ShortFilmProgramFilters): ShortFilmProgramEntry[] {
    let filteredData = [...this.PROGRAM_DATA];

    // Apply search filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filteredData = filteredData.filter(film =>
        film.title.toLowerCase().includes(searchLower) ||
        film.filmmaker.toLowerCase().includes(searchLower) ||
        film.country.toLowerCase().includes(searchLower) ||
        film.category.toLowerCase().includes(searchLower)
      );
    }

    // Apply category filter
    if (filters.category && filters.category !== 'all') {
      filteredData = filteredData.filter(film => film.category === filters.category);
    }

    // Apply country filter
    if (filters.country && filters.country !== 'all') {
      filteredData = filteredData.filter(film => film.country === filters.country);
    }

    // Apply program filter
    if (filters.program && filters.program !== 'all') {
      filteredData = filteredData.filter(film => film.program === filters.program);
    }

    return filteredData;
  }

  /**
   * Gets filtered program groups
   */
  static getFilteredProgramGroups(filters: ShortFilmProgramFilters): ProgramGroup[] {
    const filteredData = this.getFilteredPrograms(filters);
    const groups: { [key: string]: ShortFilmProgramEntry[] } = {};
    
    // Group filtered films by program
    filteredData.forEach(film => {
      if (!groups[film.program]) {
        groups[film.program] = [];
      }
      groups[film.program].push(film);
    });

    // Convert to ProgramGroup array and maintain order
    const programOrder = ["Program I", "Program II", "Program III", "Program IV"];
    
    return programOrder.map(programName => ({
      program: programName,
      films: groups[programName] || [],
      count: (groups[programName] || []).length
    })).filter(group => group.count > 0);
  }

  /**
   * Gets unique categories
   */
  static getUniqueCategories(): string[] {
    const categories = new Set(this.PROGRAM_DATA.map(film => film.category));
    return Array.from(categories).sort();
  }

  /**
   * Gets unique countries
   */
  static getUniqueCountries(): string[] {
    const countries = new Set(this.PROGRAM_DATA.map(film => film.country));
    return Array.from(countries).sort();
  }

  /**
   * Gets unique programs
   */
  static getUniquePrograms(): string[] {
    const programs = new Set(this.PROGRAM_DATA.map(film => film.program));
    return Array.from(programs).sort();
  }

  /**
   * Gets statistics for program data
   */
  static getStatistics(): {
    total: number;
    byProgram: { [key: string]: number };
    byCategory: { [key: string]: number };
    byCountry: { [key: string]: number };
  } {
    const stats = {
      total: this.PROGRAM_DATA.length,
      byProgram: {} as { [key: string]: number },
      byCategory: {} as { [key: string]: number },
      byCountry: {} as { [key: string]: number }
    };

    this.PROGRAM_DATA.forEach(film => {
      // Count by program
      stats.byProgram[film.program] = (stats.byProgram[film.program] || 0) + 1;
      
      // Count by category
      stats.byCategory[film.category] = (stats.byCategory[film.category] || 0) + 1;
      
      // Count by country
      stats.byCountry[film.country] = (stats.byCountry[film.country] || 0) + 1;
    });

    return stats;
  }

  /**
   * Gets a placeholder poster URL for films (since we don't have actual poster data)
   */
  static getPosterUrl(film: ShortFilmProgramEntry): string {
    // Return a placeholder poster based on category
    switch (film.category) {
      case 'Youth Competition':
        return 'https://firebasestorage.googleapis.com/v0/b/cifan-c41c6.firebasestorage.app/o/site_files%2Ffest_logos%2FGroup%202.png?alt=media&token=e8be419f-f0b2-4f64-8d7f-c3e8532e2689';
      case 'Future Competition':
        return 'https://firebasestorage.googleapis.com/v0/b/cifan-c41c6.firebasestorage.app/o/site_files%2Ffest_logos%2FGroup%203.png?alt=media&token=b66cd708-0dc3-4c05-bc56-b2f99a384287';
      case 'World Competition':
        return 'https://firebasestorage.googleapis.com/v0/b/cifan-c41c6.firebasestorage.app/o/site_files%2Ffest_logos%2FGroup%204.png?alt=media&token=84ad0256-2322-4999-8e9f-d2f30c7afa67';
      default:
        return 'https://firebasestorage.googleapis.com/v0/b/cifan-c41c6.firebasestorage.app/o/site_files%2Ffest_logos%2FT4%404x.png?alt=media&token=4b606f45-6165-4486-951b-4e4ccb0bdb23';
    }
  }
}
