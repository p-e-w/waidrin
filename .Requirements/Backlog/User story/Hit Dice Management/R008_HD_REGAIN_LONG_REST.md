----Do not modify this template----
###Story No###
*R008_HD_REGAIN_LONG_REST*

##Business requirements##
###1-line summary###
Characters regain half their total spent Hit Dice (minimum of one) after a Long Rest.
###Description###
After completing a Long Rest, a character should regain a number of spent Hit Dice equal to half their total Hit Dice pool (minimum of one).
###Business Value###
Resets Hit Dice for continued adventuring, adhering to DnD 5e resource management.

###User story###
As a System
when a character completes a Long Rest
I want to automatically return a number of spent Hit Dice to their pool equal to half their total Hit Dice (minimum of one)
so that characters can replenish their healing resources for future encounters.

###Acceptance criteria###
Given a character has completed a Long Rest
When the system processes the Long Rest
Then the character regains a number of spent Hit Dice equal to half their total Hit Dice pool (rounded up), with a minimum of one Hit Die regained.

Scenario 1: Regaining Hit Dice after Long Rest (even number)
Given a 4th-level character with 4 total Hit Dice, and 2 spent Hit Dice
When a Long Rest is completed
Then the character regains 2 Hit Dice (half of 4).
And their available Hit Dice become 4.

Scenario 2: Regaining Hit Dice after Long Rest (odd number, minimum one)
Given a 5th-level character with 5 total Hit Dice, and 3 spent Hit Dice
When a Long Rest is completed
Then the character regains 3 Hit Dice (half of 5 rounded up).
And their available Hit Dice become 5.

Scenario 3: Regaining Hit Dice after Long Rest (minimum one)
Given a 1st-level character with 1 total Hit Die, and 1 spent Hit Die
When a Long Rest is completed
Then the character regains 1 Hit Die (minimum of one).
And their available Hit Dice become 1.