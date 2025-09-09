----Do not modify this template----
###Story No###
*R007_HD_SPEND_SHORT_REST*

##Business requirements##
###1-line summary###
Players can spend Hit Dice during a Short Rest to regain HP.
###Description###
During a Short Rest, players should be able to choose how many of their available Hit Dice to spend. For each Hit Die spent, they roll the die and add their Constitution modifier to the result, regaining that many HP.
###Business Value###
Enables in-game healing mechanics, providing a core DnD 5e gameplay loop.

###User story###
As a Player
when my character takes a Short Rest
I want to be able to choose how many of my available Hit Dice to spend to regain Hit Points
so that I can manage my character's health during adventuring.

###Acceptance criteria###
Given a character is taking a Short Rest
And they have available Hit Dice
When the player chooses to spend a certain number of Hit Dice
Then for each Hit Die spent, the character rolls the die and adds their Constitution modifier to the result, regaining that many HP.
And the spent Hit Dice are removed from the character's available pool.

Scenario 1: Spending 2 Hit Dice (d8) with +2 Con modifier
Given a character with 3 available d8 Hit Dice and 10 current HP
And their Constitution modifier is +2
When the player spends 2 Hit Dice
And the rolls are 5 and 3
Then the character regains (5+2) + (3+2) = 12 HP.
And their current HP becomes 22.
And their available Hit Dice become 1.