/************************************************************
 * AUTOMATE GMAIL ROCKETBOOK ATTACHMENTS TO GOOGLE DRIVE
 ************************************************************/
function saveAttachmentsToDrive() {
  const label = GmailApp.getUserLabelByName("SaveToDrive");
  if (!label) {
    console.log("Label 'SaveToDrive' not found.");
    return;
  }

  // Create master folder and subfolders with timestamps
  try {    
    const masterName = "RB-Master";
    let masterFolder;
    const existing = DriveApp.getFoldersByName(masterName);
    masterFolder = existing.hasNext() ? existing.next() : DriveApp.createFolder(masterName);

    const now = new Date();
    const timestamp =
      now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, "0") +
      String(now.getDate()).padStart(2, "0") +
      "-" +
      String(now.getHours()).padStart(2, "0") + ":" +
      String(now.getMinutes()).padStart(2, "0") + ":" +
      String(now.getSeconds()).padStart(2, "0");

    const subFolder = masterFolder.createFolder(`RB-${timestamp}`);

    // Accept common JPG MIME types
    const jpgTypes = ["image/jpeg", "image/jpg", "image/pjpeg", "application/octet-stream"];

    label.getThreads().forEach(thread => {
      thread.getMessages().forEach(msg => {
        msg.getAttachments().forEach(att => {
          try {
            const name = att.getName();
            const type = att.getContentType().toLowerCase();

            // Must be JPG by MIME OR filename extension
            const isJpgMime = jpgTypes.includes(type);
            const isJpgExt = name.toLowerCase().endsWith(".jpg");

            if (!isJpgMime && !isJpgExt) {
              console.log(`Skipping non-JPG: ${name} (${type})`);
              return;
            }

            subFolder.createFile(att);
            console.log(`Saved: ${name}`);

          } catch (fileErr) {
            console.error(`Error saving attachment: ${fileErr}`);
          }
        });
      });

      // Remove label after processing so files are never reprocessed
      thread.removeLabel(label);
    });

    console.log(`Completed saving Rocketbook JPGs to ${subFolder.getName()}`);

  } catch (err) {
    console.error(`General error: ${err}`);
  }
}

/************************************************************
 * CREATE GMAIL BUTTON ON SIDEBAR
 ************************************************************/
function buildAddon(e) {
  var card = CardService.newCardBuilder();
  var section = CardService.newCardSection();

  var button = CardService.newTextButton()
    .setText("Download Attachments Now")
    .setOnClickAction(CardService.newAction().setFunctionName("runFromGmail"));

  section.addWidget(button);
  card.addSection(section);
  return card.build();
}

/************************************************************
 * BUTTON TRIGGER ACTION
 ************************************************************/
function runFromGmail() {
  saveAttachmentsToDrive();
  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification().setText("Attachments saved to Drive!"))
    .build();
}
