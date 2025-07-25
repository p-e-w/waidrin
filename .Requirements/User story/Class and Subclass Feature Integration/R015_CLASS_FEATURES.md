----Do not modify this template----
###Story No###
*R015_CLASS_FEATURES*

##Business requirements##
###1-line summary###
Integrate general class features into the character sheet.
###Description###
The system should display and apply the general features and benefits associated with a character's chosen class (e.g., Hit Die, proficiencies, Action Surge for Fighter, Bardic Inspiration for Bard).
###Business Value###
Ensures that characters correctly gain all the core abilities and benefits of their class, making them playable according to D&D 5e rules.

###User story###
As a Player
when I view my character sheet
I want to see all the general features and benefits granted by my character's class
so that I know what abilities my character possesses.

###Acceptance criteria###
Given a character has a chosen class
When the character sheet is displayed
Then all general features and benefits of that class are listed and applied.

Scenario 1: Fighter class features
Given a character is a Fighter
When their character sheet is viewed
Then "Proficiency with all armor and weapons", "Action Surge", "Second Wind", and "Extra Attack" (at appropriate levels) are displayed as features.