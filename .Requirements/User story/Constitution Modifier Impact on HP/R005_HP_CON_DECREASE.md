----Do not modify this template----
###Story No###
*R005_HP_CON_DECREASE*

##Business requirements##
###1-line summary###
Automatically adjust character's maximum HP when Constitution modifier decreases.
###Description###
If a character's Constitution modifier decreases, their maximum HP should retroactively decrease by 1 for each level they have attained.
###Business Value###
Ensures HP calculations remain accurate and consistent with DnD 5e rules, reflecting character changes.

###User story###
As a System
when a character's Constitution modifier decreases
I want the character's maximum Hit Points to be retroactively adjusted by 1 HP per level attained
so that the character's HP accurately reflects their reduced Constitution according to DnD 5e rules.

###Acceptance criteria###
Given a character's Constitution modifier has decreased
When the system processes the change
Then the character's maximum HP decreases by 1 for each level they have attained.

Scenario 1: 7th-level character with Con modifier decrease
Given a 7th-level character with a current Constitution modifier of +3 and 50 max HP
When their Constitution score decreases, changing their modifier to +2
Then their maximum HP decreases by 7 (1 HP per level) to 43.