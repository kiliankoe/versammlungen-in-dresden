export interface Assembly {
  Datum: string;
  Zeit?: string;
  // The topic can be apparently be `null`, but that's an error and shouldn't be handled. wtf.
  // Those assemblies are filtered out before being processed.
  Thema: string;
  Ort?: string;
  Startpunkt?: string;
  Teilnehmer?: string;
  Veranstalter: string | null;
  Status: string;
}
