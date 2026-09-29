# Google Slides Flashcard Utility
This project contains various app scripts that enable you to use Google Slides as flashcards. Please note that Google will issue warnings about running these scripts. As such, your authorization will be required.

### Basic Tools
The `base_tools.gs` script creates a Flashcard Tools Drop Down in your menu bar. It allows you to do the following:
1. Create Cards
2. Shuffle Cards
3. Restore Sequential Order
4. Re-index (in the case you've deleted some cards)

### Rocketbook Integration
This app script builds on the basic tools script adding the ability to import Rocketbook Cloud Cards that are stored on Google Drive. The Cloud Cards must be sent as `.jpg` files. 

This process can be lengthy so it's best to do this in small sessions and/or walk away for a bit. The `ProgressDialog.html` must be added to your Google Slides App Script.

#### Gmail .jpg Attachments to Google Drive
The manual process of clicking on each Rocketbook Cloud Card .jpg file from Gmail to Google Drive is pretty tedious. As such, there is a script that allows the automation of the Gmail -> Google Drive process. A button will be generated on the side bar menu of Gmail. This allows you to import Cloud Card `.jpg` files on demand and/or you can schedule it to run at a specific time/day/month/etc.

This app script requires the following:
1. `gmail2drive.gs`
2. `appsscript.json`
3. Create a filter for your Rocketbook emails called <span style="color:blue">SaveToDrive</span>

</br></br>

<span style="font-size: 0.8em;">
Disclaimer: Google™ and Rocketbook® are trademarks of their respective owners. This project may interact with, integrate with, or utilize products, services, APIs, or materials provided by Google and Rocketbook. All such use is subject to each company’s trademark policies, licensing terms, and developer‑use agreements.</span>