----Do not modify this template----
###Story No###
*R002_HP_LEVELUP_ROLL*

##Business requirements##
###1-line summary###
Calculate HP gain on level-up by rolling the class Hit Die and adding Constitution modifier.
###Description###
When a character gains a level, the system should allow the player to roll their class's Hit Die and add their Constitution modifier to determine the HP increase.
###Business Value###
Provides flexibility for players who prefer rolling for HP, maintaining the randomness aspect of DnD 5e.

###User story###
As a Player
when my character gains a level
I want to have the option to roll my class's Hit Die and add my Constitution modifier to determine my HP increase
so that I can experience the traditional DnD 5e method of HP progression.

###Acceptance criteria###
Given a character has gained a level
When the player chooses to roll for HP gain
Then the character's maximum HP increases by the result of rolling their class's Hit Die plus their Constitution modifier.

Scenario 1: Fighter (d10) with +2 Con modifier
Given a 2nd-level Fighter character
And their Constitution modifier is +2
When the player chooses to roll for HP gain
And the d10 roll is 7
Then the character's maximum HP increases by 7 + 2 = 9.