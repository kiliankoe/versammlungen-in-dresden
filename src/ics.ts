import { Assembly } from "./assembly";
import { Publisher } from "./publisher";
import { writeFileSync } from "fs";
import * as path from "path"; // For path.join and sanitizing

// Helper function to sanitize filenames (basic version)
function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9_\-\.]/gi, '_').toLowerCase();
}

export class IcsPublisher implements Publisher {
  private outputDirectory: string;

  constructor(outputDirectory: string) {
    this.outputDirectory = outputDirectory;
    console.log(`IcsPublisher initialized. ICS files will be saved to: ${this.outputDirectory}`);
    // In a real application, you might want to ensure this directory exists or can be created.
  }

  async publish(assembly: Assembly): Promise<void> {
    console.log(`[IcsPublisher] Attempting to publish (create ICS for): ${assembly.Thema} on ${assembly.Datum}`);

    // ICS generation logic would go here.
    // For example, using the 'ics' library:
    // import { createEvent } from 'ics';
    // const event = {
    //   start: [parseInt(assembly.Datum.substring(0,4)), parseInt(assembly.Datum.substring(5,7)), parseInt(assembly.Datum.substring(8,10)),
    //           parseInt(assembly.Zeit.substring(0,2)), parseInt(assembly.Zeit.substring(3,5))],
    //   duration: { hours: 1 }, // Example duration
    //   title: assembly.Thema,
    //   description: assembly.Antragdetails || 'Keine Details verfügbar.',
    //   location: assembly.Ort,
    //   status: 'CONFIRMED',
    //   organizer: { name: 'Assembly Organizer' }, // Placeholder
    // };
    // const { error, value } = createEvent(event);
    // if (error) {
    //   console.error('[IcsPublisher] Error creating ICS event:', error);
    //   return Promise.reject(error);
    // }
    // const icsContent = value;

    // Placeholder: Create a simple text file with assembly details
    const placeholderContent = `
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//hacksw/handcal//NONSGML v1.0//EN
BEGIN:VEVENT
UID:${new Date().toISOString()}@example.com
DTSTAMP:${new Date().toISOString().replace(/[-:.]/g, "")}Z
DTSTART:${assembly.Datum.replace(/-/g, "")}T${assembly.Zeit.replace(/:/g, "")}00
SUMMARY:${assembly.Thema}
LOCATION:${assembly.Ort}
DESCRIPTION:Details: ${assembly.Antragdetails || assembly.Status || 'N/A'}
END:VEVENT
END:VCALENDAR
    `.trim();

    const filename = sanitizeFilename(`${assembly.Thema || 'versammlung'}_${assembly.Datum}.ics`);
    const filePath = path.join(this.outputDirectory, filename);

    try {
      writeFileSync(filePath, placeholderContent);
      console.log(`[IcsPublisher] Successfully created placeholder ICS file: ${filePath}`);
    } catch (error) {
      console.error(`[IcsPublisher] Error writing ICS file ${filePath}:`, error);
      return Promise.reject(error);
    }

    return Promise.resolve();
  }

  async remind(assembly: Assembly): Promise<void> {
    console.log(`[IcsPublisher] Attempting to send reminder for: ${assembly.Thema} on ${assembly.Datum}`);
    // The concept of "reminding" by generating an ICS might not be directly applicable
    // or could mean updating an existing file/event, which is more complex.
    // For services that consume ICS, they typically handle their own reminders based on the event data.
    // If an update is needed, it would involve regenerating the ICS file with a new LAST-MODIFIED timestamp
    // and potentially a new SEQUENCE number if the event UID is the same.
    console.log("[IcsPublisher] Remind is a no-op for ICS files in this context.");
    return Promise.resolve();
  }
}
