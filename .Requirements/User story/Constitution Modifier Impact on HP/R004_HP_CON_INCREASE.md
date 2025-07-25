----Do not modify this template----
###Story No###
*R004_HP_CON_INCREASE*

##Business requirements##
###1-line summary###
Automatically adjust character's maximum HP when Constitution modifier increases.
###Description###
If a character's Constitution modifier increases (e.g., due to an Ability Score Improvement), their maximum HP should retroactively increase by 1 for each level they have attained.
###Business Value###
Ensures HP calculations remain accurate and consistent with DnD 5e rules, reflecting character growth.

###User story###
As a System
when a character's Constitution modifier increases
I want the character's maximum Hit Points to be retroactively adjusted by 1 HP per level attained
so that the character's HP accurately reflects their improved Constitution according to DnD 5e rules.

###Acceptance criteria###
Given a character's Constitution modifier has increased
When the system processes the change
Then the character's maximum HP increases by 1 for each level they have attained.

Scenario 1: 5th-level character with Con modifier increase
Given a 5th-level character with a current Constitution modifier of +2 and 30 max HP
When their Constitution score increases, changing their modifier to +3
Then their maximum HP increases by 5 (1 HP per level) to 35.