/************************************************************
 * FLASHCARD TOOLS MENU
 ************************************************************/
function onOpen() {
  SlidesApp.getUi()
    .createMenu("Flashcard Tools")
    .addItem("Create Cards", "createCardsPrompt")
    .addItem("Shuffle Cards", "shuffleFlashcards")
    .addItem("Restore Sequential Order", "restoreOrder")
    .addItem('Re-index Cards (Fix Gaps)', 'runReindex')
    .addItem("Import Rocketbook Cards", "importRocketbookCards")
    .addToUi();
}

/************************************************************
 * INDEX SLIDE DECK
 ************************************************************/
function indexSlideDeck(presentation) {
  const cardMap = {};
  let maxNumber = 0;

  presentation.getSlides().forEach(slide => {
    const elements = slide.getPageElements();

    // Helper function to process individual shapes or text boxes
    function checkElement(element) {
      try {
        if (element.getPageElementType() === SlidesApp.PageElementType.GROUP) {
          // Unpack grouped objects (circle + text box overlay)
          element.asGroup().getChildren().forEach(checkElement);
          return;
        }

        if (element.getPageElementType() === SlidesApp.PageElementType.SHAPE) {
          const shape = element.asShape();
          const shapeType = shape.getShapeType();

          // Check Rectangles, Ellipses, AND Text Boxes
          if (
            (shapeType === SlidesApp.ShapeType.RECTANGLE ||
             shapeType === SlidesApp.ShapeType.ELLIPSE ||
             shapeType === SlidesApp.ShapeType.TEXT_BOX) &&
            shape.getWidth() <= 60 &&
            shape.getHeight() <= 60
          ) {
            const textRange = shape.getText();
            if (textRange) {
              const text = textRange.asString().trim();
              const match = text.match(/^(\d+)([FB])$/i);

              if (match) {
                const num = parseInt(match[1], 10);
                const type = match[2].toUpperCase();

                if (num > maxNumber) maxNumber = num;

                if (!cardMap[num]) cardMap[num] = [];
                cardMap[num].push({ slide, type });
              }
            }
          }
        }
      } catch (e) {
        // Ignore layout-specific shape issues
      }
    }

    elements.forEach(checkElement);
  });

  return { cardMap, maxNumber };
}

/************************************************************
 * CREATE CARDS PROMPT
 ************************************************************/
function createCardsPrompt() {
  const ui = SlidesApp.getUi();
  const response = ui.prompt("How many cards do you want to create?");
  const count = parseInt(response.getResponseText(), 10);

  if (!count || count < 1) return;
  createCards(count);
}

/************************************************************
 * CREATE CARDS
 ************************************************************/
function createCards(count) {
  const presentation = SlidesApp.getActivePresentation();
  const { maxNumber } = indexSlideDeck(presentation);

  const blankLayout = presentation.getLayouts().find(l => l.getLayoutName() === "BLANK");

  const pageWidth = presentation.getPageWidth();
  const pageHeight = presentation.getPageHeight();

  const cardWidth = 7 * 72;
  const cardHeight = 5 * 72;
  const cardLeft = (pageWidth - cardWidth) / 2;
  const cardTop = (pageHeight - cardHeight) / 2;

  for (let i = 1; i <= count; i++) {
    const newNumber = maxNumber + i;

    const frontSlide = blankLayout ? presentation.appendSlide(blankLayout) : presentation.appendSlide();
    const backSlide = blankLayout ? presentation.appendSlide(blankLayout) : presentation.appendSlide();

    buildBaseFlashcard(frontSlide, cardLeft, cardTop, cardWidth, cardHeight);
    buildBaseFlashcard(backSlide, cardLeft, cardTop, cardWidth, cardHeight);

    addCornerLabel(frontSlide, `${newNumber}F`);
    addCornerLabel(backSlide, `${newNumber}B`);

    addFlipButton(frontSlide, backSlide, "Flip", pageWidth, pageHeight, SlidesApp.ShapeType.RIGHT_ARROW);
    addFlipButton(backSlide, frontSlide, "Flip", pageWidth, pageHeight, SlidesApp.ShapeType.LEFT_ARROW);

    addContentBox(frontSlide, "Front", cardLeft, cardTop, cardWidth, cardHeight);
    addContentBox(backSlide, "Back", cardLeft, cardTop, cardWidth, cardHeight);
  }
}

/************************************************************
 * BUILD BASE FLASHCARD
 ************************************************************/
function buildBaseFlashcard(slide, left, top, width, height) {
  const cardShape = slide.insertShape(
    SlidesApp.ShapeType.ROUND_RECTANGLE, 
    left,
    top,
    width,
    height
  );

  cardShape.getFill().setSolidFill("#E0E0E0");
  cardShape.getBorder().setTransparent();

  return cardShape;
}

/************************************************************
 * ADD CORNER LABEL
 ************************************************************/
function addCornerLabel(slide, labelText) {
  const x = 10;
  const y = 10;
  const diameter = 36; 

  const circle = slide.insertShape(
    SlidesApp.ShapeType.ELLIPSE,
    x, y,
    diameter, diameter
  );

  circle.getFill().setSolidFill("#FFD54F");
  const border = circle.getBorder();
  border.setWeight(1);
  border.getLineFill().setSolidFill("#FBC02D");

  const textBoxWidth = 50; 
  const offsetX = x - (textBoxWidth - diameter) / 2; // Center text box over circle

  const textBox = slide.insertTextBox(
    labelText,
    offsetX, y,
    textBoxWidth, diameter
  );

  // Vertical Centering inside text box
  textBox.setContentAlignment(SlidesApp.ContentAlignment.MIDDLE);

  const text = textBox.getText();

  const style = text.getTextStyle();
  style.setBold(true);
  style.setFontSize(8);
  style.setFontFamily("Arial");
  style.setForegroundColor("#000000");

  // Horizontal Centering
  text.getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);

  // Group circle & text box together
  slide.group([circle, textBox]);
}

/************************************************************
 * ADD FLIP BUTTON
 ************************************************************/
function addFlipButton(fromSlide, toSlide, buttonText, pageWidth, pageHeight, shapeType) {
  const buttonWidth = 60;
  const buttonHeight = 22;
  const margin = 10;

  const left = pageWidth - buttonWidth - margin;
  const top = pageHeight - buttonHeight - margin;

  const shape = fromSlide.insertShape(shapeType, left, top, buttonWidth, buttonHeight);

  const text = shape.getText();
  text.setText(buttonText);

  const style = text.getTextStyle();
  style.setBold(true);
  style.setFontSize(10);
  style.setForegroundColor("#000000");

  shape.getFill().setSolidFill("#A8E6A1");
  shape.getBorder().setWeight(1);
  shape.getBorder().setDashStyle(SlidesApp.DashStyle.SOLID);

  shape.setLinkSlide(toSlide);
}

/************************************************************
 * ADD CONTENT BOX
 ************************************************************/
function addContentBox(slide, labelText, cardLeft, cardTop, cardWidth, cardHeight) {
  const boxWidth = cardWidth * 0.85;
  const boxHeight = cardHeight * 0.60;

  const left = cardLeft + (cardWidth - boxWidth) / 2;
  const top = cardTop + (cardHeight - boxHeight) / 2;

  const shape = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, left, top, boxWidth, boxHeight);
  shape.getFill().setTransparent();
  shape.getBorder().setTransparent();

  const text = shape.getText();
  text.setText(labelText + "\n\nEnter text here");

  text.getTextStyle().setFontSize(16);
  text.getTextStyle().setForegroundColor("#000000");
  text.getRange(0, labelText.length).getTextStyle().setBold(true);
}

/************************************************************
 * INSERT IMAGE INTO CARD
 ************************************************************/
function insertImageIntoCard(slide, file, cardLeft, cardTop, cardWidth, cardHeight) {
  const boxWidth = cardWidth * 0.85;
  const boxHeight = cardHeight * 0.60;

  const left = cardLeft + (cardWidth - boxWidth) / 2;
  const top = cardTop + (cardHeight - boxHeight) / 2;

  try {
    const blob = file.getBlob();
    const mime = blob.getContentType();

    if (!mime.startsWith("image/")) {
      throw new Error("Unsupported MIME type: " + mime);
    }

    slide.insertImage(blob, left, top, boxWidth, boxHeight);

  } catch (err) {
    const fallback = slide.insertTextBox(
      `[Image Load Failed: ${file ? file.getName() : "Unknown"}]`,
      left, top, boxWidth, boxHeight
    );
    fallback.getText().getTextStyle().setForegroundColor("#D32F2F");
  }
}

/************************************************************
 * SHUFFLE FLASHCARDS
 ************************************************************/
function shuffleFlashcards() {
  const presentation = SlidesApp.getActivePresentation();
  const { cardMap } = indexSlideDeck(presentation);

  const cardNumbers = Object.keys(cardMap);

  // Fisher–Yates shuffle
  for (let i = cardNumbers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cardNumbers[i], cardNumbers[j]] = [cardNumbers[j], cardNumbers[i]];
  }

  let newIndex = 0;
  cardNumbers.forEach(num => {
    const pair = cardMap[num];
    pair.sort((a, b) => (a.type === "F" ? -1 : 1));
    pair.forEach(item => item.slide.move(newIndex++));
  });
}

/************************************************************
 * RESTORE ORDER
 ************************************************************/
function restoreOrder() {
  const presentation = SlidesApp.getActivePresentation();
  const { cardMap } = indexSlideDeck(presentation);

  const cardNumbers = Object.keys(cardMap).map(Number).sort((a, b) => a - b);

  let newIndex = 0;
  cardNumbers.forEach(num => {
    const pair = cardMap[num];
    pair.sort((a, b) => (a.type === "F" ? -1 : 1));
    pair.forEach(item => item.slide.move(newIndex++));
  });
}

/************************************************************
 * RE-INDEX DECK
 ************************************************************/
function runReindex() {
  const presentation = SlidesApp.getActivePresentation();

  restoreOrder();
  reindexDeck(presentation);
}

function reindexDeck(presentation) {
  const { cardMap } = indexSlideDeck(presentation);

  const cardNumbers = Object.keys(cardMap).map(Number).sort((a, b) => a - b);

  let newCounter = 1;

  cardNumbers.forEach(oldNum => {
    const pair = cardMap[oldNum];

    pair.forEach(cardObj => {
      const elements = cardObj.slide.getPageElements();

      elements.forEach(element => {
        function updateText(el) {
          if (el.getPageElementType() === SlidesApp.PageElementType.GROUP) {
            el.asGroup().getChildren().forEach(updateText);
          } else if (el.getPageElementType() === SlidesApp.PageElementType.SHAPE) {
            const shape = el.asShape();
            const textRange = shape.getText();

            if (textRange) {
              const text = textRange.asString().trim();

              if (text.toUpperCase() === `${oldNum}${cardObj.type}`) {
                textRange.setText(`${newCounter}${cardObj.type}`);
              }
            }
          }
        }
        updateText(element);
      });
    });

    newCounter++;
  });
}

/************************************************************
 * IMPORT ROCKETBOOK CARDS
 ************************************************************/
function importRocketbookCards() {
  Logger.log("IMPORT ROCKETBOOK CARDS RAN");
  const ui = SlidesApp.getUi();

  const response = ui.prompt(
    "Rocketbook Import",
    "Paste the Google Drive folder URL or Folder ID:",
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() !== ui.Button.OK) return;

  const rawInput = response.getResponseText().trim();
  if (!rawInput) {
    ui.alert("No folder URL or ID provided.");
    return;
  }

  // Extract folder ID from URL or raw input
  const folderId = extractFolderId(rawInput);
  if (!folderId) {
    ui.alert("No valid folder URL or ID provided.");
    return;
  }

  // Validate folder access
  try {
    DriveApp.getFolderById(folderId);
  } catch (e) {
    ui.alert("Folder not found. Please check the URL or ID and try again.");
    return;
  }

  PropertiesService.getUserProperties().setProperty("IMPORT_FOLDER_ID", folderId);

  // Launch progress dialog (with fallback)
  try {
    const htmlOutput = HtmlService.createHtmlOutputFromFile("ProgressDialog")
      .setWidth(260)
      .setHeight(40)
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);

    SlidesApp.getUi().showModelessDialog(htmlOutput, "Importing Rocketbook Cards");
  } catch (err) {
    Logger.log("Modeless dialog failed, falling back to Sidebar: " + err.toString());
    const htmlOutput = HtmlService.createHtmlOutputFromFile("ProgressDialog")
      .setTitle("Importing Rocketbook Cards");
    SlidesApp.getUi().showSidebar(htmlOutput);
  }
}

/************************************************************
 * EXTRACTS A GOOGLE DRIVE FOLDER ID
 ************************************************************/
function extractFolderId(input) {
  if (!input) return null;
  
  const trimmed = input.trim();
  
  const match = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return match[1];
  }

  // Fallback: If no URL pattern is found, assume the user pasted the raw ID directly
  return trimmed;
}

/************************************************************
 * GET IMPORT METADATA
 ************************************************************/
function getImportMetadata() {
  const userProps = PropertiesService.getUserProperties();
  const folderId = userProps.getProperty("IMPORT_FOLDER_ID");

  const iter = DriveApp.getFolderById(folderId).getFiles();
  const files = [];

  while (iter.hasNext()) {
    const f = iter.next();
    if (f.getMimeType().startsWith("image/")) {
      files.push({ id: f.getId(), name: f.getName() });
    }
  }

  files.sort((a, b) => a.name.localeCompare(b.name));

  userProps.setProperty("IMPORT_FILE_IDS", JSON.stringify(files));

  return { totalPairs: Math.ceil(files.length / 2) };
}

/************************************************************
 * IMPORT SINGLE PAIR
 ************************************************************/
function importSinglePair(pairIndex) {
  const userProps = PropertiesService.getUserProperties();
  const fileIds = JSON.parse(userProps.getProperty("IMPORT_FILE_IDS"));

  const presentation = SlidesApp.getActivePresentation();
  const blankLayout = presentation.getLayouts().find(l => l.getLayoutName() === "BLANK");

  const pageWidth = presentation.getPageWidth();
  const pageHeight = presentation.getPageHeight();

  const cardWidth = 7 * 72;
  const cardHeight = 5 * 72;
  const cardLeft = (pageWidth - cardWidth) / 2;
  const cardTop = (pageHeight - cardHeight) / 2;

  const { maxNumber } = indexSlideDeck(presentation);
  const cardNumber = maxNumber + 1;

  const front = fileIds[pairIndex * 2];
  const back = fileIds[pairIndex * 2 + 1];

  const frontSlide = blankLayout ? presentation.appendSlide(blankLayout) : presentation.appendSlide();
  const backSlide = blankLayout ? presentation.appendSlide(blankLayout) : presentation.appendSlide();

  // Build flashcard background
  buildBaseFlashcard(frontSlide, cardLeft, cardTop, cardWidth, cardHeight);
  buildBaseFlashcard(backSlide, cardLeft, cardTop, cardWidth, cardHeight);

  // Corner labels
  addCornerLabel(frontSlide, `${cardNumber}F`);
  addCornerLabel(backSlide, `${cardNumber}B`);

  // Flip buttons
  addFlipButton(frontSlide, backSlide, "Flip", pageWidth, pageHeight, SlidesApp.ShapeType.RIGHT_ARROW);
  addFlipButton(backSlide, frontSlide, "Flip", pageWidth, pageHeight, SlidesApp.ShapeType.LEFT_ARROW);

  // Insert Rocketbook images
  if (front) insertImageIntoCard(frontSlide, DriveApp.getFileById(front.id), cardLeft, cardTop, cardWidth, cardHeight);
  if (back) insertImageIntoCard(backSlide, DriveApp.getFileById(back.id), cardLeft, cardTop, cardWidth, cardHeight);
}

/************************************************************
 * INSERT ROCKETBOOK IMAGE
 ************************************************************/
function insertRocketbookImage(slide, file, pageWidth, pageHeight) {
  const boxWidth = pageWidth * 0.75;
  const boxHeight = pageHeight * 0.50;

  const left = (pageWidth - boxWidth) / 2;
  const top = (pageHeight - boxHeight) / 2;

  try {
    const blob = file.getBlob();
    const mime = blob.getContentType();

    if (!mime.startsWith("image/")) {
      throw new Error("Unsupported MIME type: " + mime);
    }

    slide.insertImage(blob, left, top, boxWidth, boxHeight);

  } catch (err) {
    const fallback = slide.insertTextBox(
      `[Image Load Failed: ${file ? file.getName() : "Unknown"}]`,
      left, top, boxWidth, boxHeight
    );
    fallback.getText().getTextStyle().setForegroundColor("#D32F2F");
  }
}

function debugFolder() {
  const folderId = PropertiesService.getUserProperties().getProperty("IMPORT_FOLDER_ID");
  const iter = DriveApp.getFolderById(folderId).getFiles();
  while (iter.hasNext()) {
    const f = iter.next();
    Logger.log(f.getName() + " → " + f.getMimeType());
  }
}
