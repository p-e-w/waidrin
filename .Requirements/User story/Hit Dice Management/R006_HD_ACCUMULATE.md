----Do not modify this template----
###Story No###
*R006_HD_ACCUMULATE*

##Business requirements##
###1-line summary###
Characters accumulate a pool of Hit Dice equal to their character level.
###Description###
Each time a character gains a level, they should gain 1 additional Hit Die, adding it to their pool of available Hit Dice.
###Business Value###
Accurately tracks Hit Dice for short rest healing, adhering to DnD 5e rules.

###User story###
As a System
when a character gains a level
I want to automatically add one Hit Die to their Hit Dice pool
so that their available Hit Dice accurately reflect their character level for short rest healing.

###Acceptance criteria###
Given a character has gained a level
When the system processes the level-up
Then the character's Hit Dice pool increases by 1.

Scenario 1: Character levels up from 1 to 2
Given a 1st-level character with 1 Hit Die
When they gain a level to become 2nd-level
Then their Hit Dice pool becomes 2.