export interface ShortFilmProgramEntry {
  program: string;
  title: string;
  country: string;
  filmmaker: string;
  category: string;
  runtime: string;
}

export interface ProgramGroup {
  program: string;
  films: ShortFilmProgramEntry[];
  count: number;
}

export interface ShortFilmProgramFilters {
  searchTerm?: string;
  category?: string;
  country?: string;
  program?: string;
}
