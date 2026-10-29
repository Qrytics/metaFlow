# Hackathon Grading Rubric (judge-grounded)

Weights taken directly from the official guide: Impact 30, Meta AI Tooling 25,
Demo 25, Technical Depth 20. Each dimension scores 0 to 10. Total is out of 100:

```
total = 3*Impact + 2.5*Tooling + 2.5*Demo + 2*TechDepth
```

## Hard gates (fail one and the idea is out, whatever it scores)

- G1 Banned topic: medical advice, HR screening, politics or war, lifestyle or
  sports coaching as the product, or anything violating platform policy.
- G2 Wrapper shape: a single model doing the work, or extra models in decorative
  roles that could be deleted without changing the output.
- G3 No deterministic verifier: the verdict rests on LLM judgment alone, with no
  measurement, proof, or check a script could re-run.
- G4 No visual demo artifact producible inside a 3-minute video.
- G5 Sketch-to-code family: draw something on paper and it turns into code.
  Ruled out by explicit instruction.
- G6 Unfixtureable: needs data or assets no team could credibly fake in a week.
- G7 Surveillance: tracking people for policing or monitoring purposes, which the
  SAM license also prohibits.

## Impact, 30 percent (who benefits, how much, Meta fit)

- 9-10: daily pain for thousands inside Meta or millions outside, with money,
  compliance, safety, or launch velocity attached. Only Meta has it at this scale.
- 7-8: real weekly workflow pain, clear beneficiary, measurable time or money.
- 5-6: plausible pain, generic beneficiary, soft return.
- 3-4: occasional annoyance, weak beneficiary.
- 0-2: toy with no clear user.

## Meta AI Tooling, 25 percent (integration creativity, beyond wrappers)

- 9-10: four or more models with irreplaceable jobs, open-weight (-1026) in the
  loop, verifiable agent pattern with a critic loop.
- 7-8: three models with distinct jobs, two or more modalities, self-correction loop.
- 5-6: two or three models chained but substitutable, one dominant modality.
- 3-4: one model working, others decorative.
- 0-2: basic wrapper or banned-trope shape.

## Demo, 25 percent (3-minute video, visual-first, viral surface)

- 9-10: visual before-and-after inside the first 5 seconds, live artifact, replayable.
- 7-8: clear visual payoff inside 30 seconds, real artifact.
- 5-6: understandable demo but terminal or text heavy, slow payoff.
- 3-4: narration over screenshots.
- 0-2: no visual artifact.

## Technical Depth, 20 percent (engineering, verifiable workflows)

- 9-10: deterministic verifier as the load-bearing component, measured numbers,
  named edge states and failure handling.
- 7-8: real verifier plus tests plus sane architecture.
- 5-6: some checks, mostly LLM-judged.
- 3-4: prompt only, no verification.
- 0-2: vaporware shape.

## Tie-breaks, in order

1. Higher Demo score. 2. Higher Impact score. 3. Harder to copy: fewer competing
   teams would plausibly build it.

## Worked example

HoldoutHonesty: Impact 7 (real weekly experimentation pain, measurable money),
Tooling 8 (Spark parses, set logic verifies, Wonder remediates), Demo 8 (two
screens, green proof versus red leak list), TechDepth 9 (empty-intersection proof,
pure determinism). Total = 21 + 20 + 20 + 18 = 79.
