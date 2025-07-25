----Do not modify this template----
###Story No###
*R003_HP_LEVELUP_AVERAGE*

##Business requirements##
###1-line summary###
Calculate HP gain on level-up by taking the average of the class Hit Die and adding Constitution modifier.
###Description###
When a character gains a level, the system should allow the player to choose to take the average HP gain for their class's Hit Die (rounded up) and add their Constitution modifier.
###Business Value###
Provides consistency and predictability for players who prefer average HP, aligning with common house rules.

###User story###
As a Player
when my character gains a level
I want to have the option to take the average HP gain for my class's Hit Die (rounded up) and add my Constitution modifier
so that I can have a predictable and consistent HP progression.

###Acceptance criteria###
Given a character has gained a level
When the player chooses to take the average HP gain
Then the character's maximum HP increases by the average result of their class's Hit Die (rounded up) plus their Constitution modifier.

Scenario 1: Rogue (d8) with +1 Con modifier
Given a 3rd-level Rogue character
And their Constitution modifier is +1
When the player chooses to take average HP gain
Then the character's maximum HP increases by 5 (average d8) + 1 = 6.

Scenario 2: Sorcerer (d6) with +0 Con modifier
Given a 4th-level Sorcerer character
And their Constitution modifier is +0
When the player chooses to take average HP gain
Then the character's maximum HP increases by 4 (average d6) + 0 = 4.