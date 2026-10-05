AMI: An Affect Mix Index tool for monitoring social media sentiment
===========
The AMI plugin enables social media users to measure and analyze the affective content of any source (currently on twitter.com).

How it works
------------
AMI works by reading in each post and then scoring each word in the tweet with a positive or negative integer based on this dictionary (https://github.com/soops/sentimood). Then based on the sum of all the words in the post, AMI labels each post as primarily containing one of five affective categories: High Arousal Negative (HAN), Low Arousal Negative (LAN), Neutral (NEU), Low Arousal Positive (LAP), or High Arousal Positive (HAP).

Currently, the plugin only works on the Chrome browser (stay tuned for a Safari update).

You do not need a twitter account for this to work.
If you don't have an account, you can go here: https://twitter.com/explore

The AMI plugin will overlay a continuously updated graphic on twitter's User Interface to show you the affective breakdown of the current twitter stream. (future versions may code different adaptive display options)

Every time you visit a different feed or page on twitter you must reload the page so that the AMI graphic can refresh with an accurate count of that page's affective content. (future versions may include an automatic page refresh)

Installation
------------
First download and unzip the folder
<img width="1080" alt="ami_dwnld_instr" src="https://user-images.githubusercontent.com/1163119/189460856-3e9f0923-c62c-4c38-bbde-3e7da87ba390.png">

Then...

Mac:
Open Chrome
Go to Window --> Extensions
<img width="804" alt="ami_chome_ext" src="https://user-images.githubusercontent.com/1163119/189463233-ceb34315-1647-4036-aa03-c8596155249e.png">



Toggle on "Developer Mode" on the upper right corner
Click "Load Unpacked"
<img width="674" alt="ami_dev_mode" src="https://user-images.githubusercontent.com/1163119/189463352-c370808f-66f4-4a07-905c-e43f59e7e01d.png">



Navigate to the where you saved the folder, click on it
Click Select
<img width="676" alt="ami_select_ext" src="https://user-images.githubusercontent.com/1163119/189463647-ad370633-82ad-4b5b-93ff-6ee2b9139db7.png">



Check to make sure you can see the extension is installed
<img width="674" alt="ami_check_install" src="https://user-images.githubusercontent.com/1163119/189463835-6d428702-f4a9-4a47-9d3f-b6b97434d347.png">




Windows:
Open Chrome
Go to Extension icon on upper right (looks like a puzzle piece type thing right next to the URL box) —> Manage Extensions
Toggle on "Developer Mode" on the upper right corner
Click "Load Unpacked"
Navigate to the where you saved the folder, click on it
Click Select
Check to make sure you can see the extension is installed
