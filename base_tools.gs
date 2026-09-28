/************************************************************
 * FLASHCARD TOOLS MENU
 ************************************************************/
function onOpen() {
  SlidesApp.getUi()
    .createMenu("Flashcard Tools")
    .addItem("Create Cards", "createCardsPrompt")
    .addItem("Shuffle Cards", "shuffleFlashcards")
    .addItem("Restore Sequential Order", "restoreOrder")
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

    for (let element of elements) {
      try {
        if (element.getPageElementType() === SlidesApp.PageElementType.SHAPE) {
          const shape = element.asShape();

          if (
            (shape.getShapeType() === SlidesApp.ShapeType.RECTANGLE ||
            shape.getShapeType() === SlidesApp.ShapeType.ELLIPSE) &&
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
                break;
              }
            }
          }
        }
      } catch (e) {
        // Ignore layout-specific shape issues
      }
    }
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
  const diameter = 36;

  const shape = slide.insertShape(
    SlidesApp.ShapeType.ELLIPSE,
    10, 10,
    diameter, diameter
  );

  shape.getFill().setSolidFill("#FFD54F");
  const border = shape.getBorder();
  border.setWeight(1);
  border.getLineFill().setSolidFill("#FBC02D");

  const text = shape.getText();
  text.setText(labelText);

  const style = text.getTextStyle();
  style.setBold(true);
  style.setFontSize(8);
  style.setForegroundColor("#000000");

  text.getParagraphStyle().setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
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
 * SHUFFLE FLASHCARDS
 ************************************************************/
function shuffleFlashcards() {
  const presentation = SlidesApp.getActivePresentation();
  const { cardMap } = indexSlideDeck(presentation);

  const cardNumbers = Object.keys(cardMap);

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
