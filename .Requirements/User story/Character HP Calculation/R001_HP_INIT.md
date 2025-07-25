----Do not modify this template----
###Story No###
*R001_HP_INIT*

##Business requirements##
###1-line summary###
Calculate initial HP for 1st-level characters based on class Hit Die and Constitution modifier.
###Description###
When a new 1st-level character is created, their HP should be automatically calculated as the maximum value of their class's Hit Die plus their Constitution modifier.
###Business Value###
Ensures new characters have correct starting HP, streamlining character creation and adhering to DnD 5e rules.

###User story###
As a Game Master or Player
when I am creating a new 1st-level character
I want the system to automatically calculate and display the character's initial Hit Points
so that I can quickly and accurately set up new characters according to DnD 5e rules.

###Acceptance criteria###
Given a new 1st-level character is being created
When the character's class and Constitution modifier are set
Then the character's maximum HP is calculated as the maximum roll of their class's Hit Die plus their Constitution modifier.

Scenario 1: Barbarian (d12) with +3 Constitution modifier
Given a new 1st-level Barbarian character
And their Constitution modifier is +3
When the character sheet is viewed
Then their HP is 12 + 3 = 15.

Scenario 2: Wizard (d6) with +2 Constitution modifier
Given a new 1st-level Wizard character
And their Constitution modifier is +2
When the character sheet is viewed
Then their HP is 6 + 2 = 8.