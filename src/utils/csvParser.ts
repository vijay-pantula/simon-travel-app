export interface ProjectCSVRow {
  client_name: string;
  project_location: string;
  project_city: string;
  start_date: string;
  end_date: string;
}

export interface ConsultantCSVRow {
  name: string;
  email: string;
  home_location?: string;
  base_airport?: string;
  passport_country?: string;
  date_of_birth?: string;
}

export interface AssignmentCSVRow {
  consultant_email: string;
  project_client_name: string;
  travel_from_location: string;
  travel_to_location: string;
  departure_date: string;
  return_date?: string;
}

export function parseCSV(text: string): string[][] {
  const lines = text.split('\n').filter(line => line.trim());
  return lines.map(line => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    return values;
  });
}

export function validateProjectRow(row: Record<string, string>): ProjectCSVRow | null {
  if (!row.client_name || !row.project_location || !row.project_city || !row.start_date || !row.end_date) {
    return null;
  }

  return {
    client_name: row.client_name,
    project_location: row.project_location,
    project_city: row.project_city,
    start_date: row.start_date,
    end_date: row.end_date,
  };
}

export function validateConsultantRow(row: Record<string, string>): ConsultantCSVRow | null {
  if (!row.name || !row.email) {
    return null;
  }

  return {
    name: row.name,
    email: row.email,
    home_location: row.home_location,
    base_airport: row.base_airport,
    passport_country: row.passport_country,
    date_of_birth: row.date_of_birth,
  };
}

export function csvToObjects<T>(csv: string[][]): T[] {
  if (csv.length < 2) return [];

  const headers = csv[0].map(h => h.toLowerCase().replace(/\s+/g, '_'));
  const rows = csv.slice(1);

  return rows.map(row => {
    const obj: Record<string, string> = {};
    headers.forEach((header, index) => {
      obj[header] = row[index] || '';
    });
    return obj as T;
  });
}
