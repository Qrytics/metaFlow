# Top 20: elaborated picks from the 1000-idea list

Selection bar: a real Meta-internal pain, a chain of three or more Muse models where
each model does a job the others cannot, a deterministic verifier a wrapper cannot
fake, a demo that lands in seconds, and a reason most teams will not think of it.
Each entry follows the same shape: pain, chain, verifier, demo, moat, risk.

## How this list was graded

Rubric in `rubric.md`, weights from the official guide: Impact 30, Tooling 25,
Demo 25, TechDepth 20. Total = 3I + 2.5T + 2.5D + 2E. Hard gates eliminated
banned topics, single-model wrappers, verifier-free pitches, the sketch-to-code
family, unfixtureable demos, and surveillance uses. All 100 idea sections plus
all 18 earlier concepts were scored in `scoreboard.md` (120 score rows,
math machine-checked). Two swaps resulted: ConsentReplay (80) in for
BuildCop (72), SolderQA (79) in for DeadPixelMap (74). PolicyPrecheck (78)
holds the last slot over DamageMap (78) on tie-break rule 3. A full re-sift of
all 830 non-hardware ideas in `scoreboard-full.md` confirmed no intruders: the
closest challenger is LogLipSync at 77.5. First alternates: DamageMap (78),
LogLipSync (77.5). New entries carry their score inline below.

| # | Idea | Tot |
|---|------|-----|
| 1 | DataMap | 88 |
| 1 | Incident Reconstructor | 88 |
| 3 | ANRReplayer | 83 |
| 4 | RunbookFromWreckage | 82.5 |
| 5 | LEDWitness | 82 |
| 5 | FlashWitness | 82 |
| 5 | TorqueSeal | 82 |
| 5 | Contrast | 82 |
| 5 | Scrub | 82 |
| 5 | ReframeGuard | 82 |
| 5 | HandoffEscrow | 82 |
| 12 | BabelFish standups | 80.5 |
| 13 | ChargebackFile | 80 |
| 13 | PagerDedup | 80 |
| 13 | ConsentReplay | 80 |
| 16 | HoldoutHonesty | 79 |
| 16 | WipeCert | 79 |
| 16 | CalibrationDue | 79 |
| 16 | SolderQA | 79 |
| 20 | PolicyPrecheck | 78 |

---

## 1. DataMap: privacy collection auditor for feature demos

**Pain.** Every Meta feature ships through privacy review, and reviewers manually map
what a UI collects against the declared data inventory. Under consent-decree
pressure this bottleneck is slow, expensive, and error-prone. One undeclared field
in a demo can stall a launch by weeks.

**Chain.** A screen recording of the feature goes to SAM 3.1, which tracks every
input, picker, toggle, and permission prompt frame by frame. The PM's walkthrough
audio goes to Voice with diarization. Spark Open maps each observed element to
entries in the data inventory and drafts the review memo. Muse Image renders the
annotated flow the reviewer actually signs off on.

**Verifier.** Deterministic schema check: every observed collection point must match
a declared inventory entry. The output is a per-element pass/fail list, and anything
collected but undeclared is flagged with the exact frame and timestamp. No LLM
judgment involved in the verdict, only in the explanation.

**Demo.** Play a 20-second settings-screen recording. The auditor draws boxes around
three inputs, two glow green (declared), one pulses red: "location collected, not in
inventory, frame 0:14." The room gets it instantly.

**Moat.** Requires knowing Meta lives under privacy scrutiny. Other teams will build
generic "AI code reviewers"; nobody walks in with a consent-decree story.

**Risk.** Needs a realistic inventory fixture for the demo. Build it from a real
settings screen so the mapping is credible.

## 2. Incident Timeline Reconstructor: bridge audio to verified SEV report

**Pain.** Meta runs incident bridges with 20-plus people talking over each other:
engineers, managers, comms. Afterward someone spends hours reconstructing what
happened when for the SEV report, mostly from memory and scrolling chat.

**Chain.** Voice transcribes the bridge with full diarization. Spark Open drafts the
timeline plus follow-up tasks. Deterministic pre-checks align every claimed event
against machine logs and reject anything outside the tolerance window. Wonder
repairs the draft from the violation report, capped at three retries.

**Verifier.** Temporal alignment: each timeline entry must match a log line within
the tolerance, otherwise it is flagged ungrounded and cut. The report that ships
has a cited log line per timestamp. Time is the contract.

**Demo.** Play 30 seconds of chaotic overlapping bridge audio. Watch a timestamped
timeline snap into place, with one hallucinated claim visibly struck through for
failing log alignment. Judges who have lived on-call will feel this one physically.

**Moat.** Everyone diarizes; nobody verifies against logs. The temporal-contract
angle is genuinely novel and mirrors real incident-review rigor.

**Risk.** Needs sample logs and bridge audio that look real. Fabricate a tight,
believable fixture rather than recording a real incident.

## 3. LEDWitness: glasses recording-light verification

**Pain.** Ray-Ban Meta glasses signal recording with an LED. Regulators, reviewers,
and trust teams need proof the light is actually on in every recording session,
and today that proof is manual spot-checking of footage.

**Chain.** Session footage goes to SAM, which localizes the LED region across
frames. Deterministic vision code reads LED state per frame. Spark Open assembles
the compliance report per session. Anything with the light off during recording
is flagged with frame ranges.

**Verifier.** LED-state detection per frame, aggregated per session. Binary output:
compliant or not, with the exact frames as evidence. No interpretation.

**Demo.** Two clips side by side: light on (green check, frame counter running),
light obscured (red flag at 0:07-0:11). Five seconds and the value is obvious.

**Moat.** Tiny, concrete, Meta-specific, and privacy-positive. Nobody else will
think to verify the indicator light, which is exactly why it is memorable.

**Risk.** Needs footage where the LED is visible and a case where it is not.
Stage both carefully; the demo lives or dies on the fixtures.

## 4. ChargebackFile: chargeback evidence assembly

**Pain.** Meta Pay fights chargebacks with scattered evidence: order timelines in
one system, support transcripts in another, delivery scans in a third. Analysts
assemble each file by hand, and weak files lose money.

**Chain.** Voice transcribes the support calls with diarization. Spark Open drafts
the evidence file from order events, transcripts, and delivery scans. Deterministic
checks require every claim to cite an order event or timestamp, and drop any claim
that cannot. Wonder repairs the draft from the violation report.

**Verifier.** Citation coverage: every assertion in the file must point at an order
event or transcript timestamp. The file ships with a coverage percentage, and
anything below the bar is visibly marked weak before submission.

**Demo.** Drop in a messy dispute: three calls, one order, one delivery scan.
Watch a structured file assemble itself, with two claims flagged weak for lack of
evidence. Money language lands with every judge.

**Moat.** Money-movement tooling with a verifiable evidence bar. Most teams avoid
payments as boring; boring that prints money wins Impact points.

**Risk.** Real dispute data is sensitive. Build the fixture from synthetic orders
that mirror real dispute shapes.

---

## 5. ANRReplayer: bug video to verified repro

**Pain.** Mobile QA at Meta scale drowns in screen recordings of freezes and
crashes with one-line descriptions. Engineers replay them by hand, guessing at
the taps that led to the failure.

**Chain.** SAM tracks the reporter's taps and the broken element across the video
frames. Voice transcribes the narration. Spark Open writes a minimal replay script
plus a regression test. Wonder executes the replay against a build via
computer-use. The repro either reproduces the crash or it is rejected.

**Verifier.** Binary and brutal: the crash reproduces under replay or the artifact
is thrown out. No partial credit, no "likely repro steps." The test suite is the
judge.

**Demo.** Play a 15-second frozen-screen recording. Watch the replay script drive
the app to the same frozen screen, then watch the regression test go green on the
fixed build. Cause and effect, on screen, in under a minute.

**Moat.** Verifiable computer-use applied to the least glamorous, most expensive
part of mobile QA. Every judge has filed a bug that died in triage.

**Risk.** Computer-use replay is flaky on real device farms. Scope the demo to an
emulator flow with deterministic timing.

## 6. HoldoutHonesty: holdout exclusion proof

**Pain.** Experimentation at Meta runs on trust in holdouts. If holdout users leak
into targeting, readouts lie quietly for weeks. Nobody checks; everyone assumes.

**Chain.** Spark Open parses targeting definitions and holdout rosters. Deterministic
set logic computes the intersection. If it is non-empty, the offending users and
rules are listed. Wonder drafts the remediation: which rule leaked and how to fix
the definition.

**Verifier.** Empty-intersection proof. Either the sets are disjoint, with the
computation shown, or they are not, with the leaked members named. Pure set
logic, zero judgment.

**Demo.** Show a clean experiment (green: "0 users in both sets, proof attached")
then a leaky one (red: "312 users targeted AND held out, rule 4 leaked them").
Two screens, total clarity.

**Moat.** Experimentation integrity is invisible infrastructure nobody demos, which
is precisely why it stands out. Deterministic, fast, and obviously correct.

**Risk.** Dry as a demo unless the stakes are narrated well. Frame it as "every
experiment decision you made this quarter might rest on this check."

## 7. ConsentReplay: consent-flow verification from recordings

**Pain.** Consent screens ship in dozens of variants across surfaces, and the
words users agree to drift from the approved legal copy with every redesign.
Nobody re-checks them after launch, until an audit or a regulator does.

**Chain.** Screen recordings of the consent flow go to SAM for region
segmentation plus OCR of the consent text. Voice transcribes any spoken
walkthrough. Spark Open diffs observed copy against the approved strings and
drafts the fix list. Wonder verifies the corrected screens.

**Verifier.** Exact string match between observed and approved consent copy, per
screen and per locale. A single changed word fails the screen, with the
screenshot and the diff attached. No interpretation, only comparison.

**Demo.** Replay three consent screens: two pass silently, the third freezes
with the changed sentence highlighted next to the approved text. Then the fixed
screen passing. Compliance theater that ends in applause.

**Moat.** Deterministic to the bone and privacy-positive, in the exact language
regulators speak. Nobody demos consent copy, which is why it lands.

**Risk.** Needs the approved copy fixture per locale. Build it from one real
flow and present multi-locale as the scaling story.

**Score.** Impact 8, Tooling 8, Demo 8, TechDepth 8 = 80. Graded
post-sift; promoted over BuildCop (72) on every dimension that matters.

## 8. FlashWitness: firmware LED pattern verification

**Pain.** During firmware flashing, devices signal progress and failure through LED
patterns. Technicians eyeball them on the line, and misread patterns brick units
or ship unflashed ones.

**Chain.** Line footage goes to SAM, which localizes the LED across frames.
Deterministic vision code extracts the blink pattern and compares it to the
expected sequence per firmware stage. Spark Open assembles the per-unit verdict
log. Wonder narrates anomalies for the line supervisor.

**Verifier.** Pattern-sequence match per stage. Expected versus observed, blink by
blink. A unit passes only on an exact match.

**Demo.** Two units flashing side by side: one marches through the expected
pattern to a green PASS, the other stalls at stage three and gets flagged with
the exact missed blink. Manufacturing theater that reads instantly.

**Moat.** Frontier track loves machines gaining capabilities, and this is a
machine watching another machine. Almost nobody brings factory-floor ideas.

**Risk.** Needs staged footage with controlled LED patterns. Build a small rig or
simulate the feed cleanly rather than filming a noisy line.

## 9. TorqueSeal: torque-seal paint verification

**Pain.** Assembly lines mark torqued fasteners with torque-seal paint. If the
mark is broken or missing, the fastener may have moved, and the unit needs
rework. Inspection is human, fast, and inconsistent.

**Chain.** Post-assembly photos go to SAM, which segments each fastener and its
paint mark. Deterministic vision code classifies each mark intact or broken.
Spark Open assembles the per-unit rework list. Wonder summarizes shift-level
trends for the line lead.

**Verifier.** Per-fastener intact-or-broken verdicts with the photo evidence
attached. Countable, auditable, appealable.

**Demo.** One board photo: twelve fasteners get boxed in green, one pulses red
with a zoomed crop of the cracked seal. The entire value proposition in one
image.

**Moat.** Absurdly concrete and visual. Judges remember the demo with the red
fastener long after forgetting the chatbot pitches.

**Risk.** Paint-mark appearance varies by lighting and vendor. Calibrate on the
demo fixture and disclose the calibration.

---

## 10. Contrast: accessibility auditor from interaction video

**Pain.** FB, IG, and WhatsApp ship weekly across thousands of screens, and
accessibility audits are manual, slow, and always behind. Violations reach users
because nobody measured them in time.

**Chain.** SAM segments tap targets and text regions frame by frame from
interaction video. Python computes real contrast ratios and tap-target sizes in
pixels from the masks. Spark Open maps failures to WCAG rules and drafts fixes.
Wonder verifies the patched screenshot, and Image renders the corrected mock.

**Verifier.** Measured numbers, not opinions: contrast ratios computed from pixels,
tap sizes measured from masks, WCAG thresholds applied deterministically. Every
violation carries its measurement.

**Demo.** Scrub through a settings screen while violations light up with their
ratios ("3.1:1, needs 4.5:1"), then flip to the fixed mock where every badge
reads green. Numbers on screen beat adjectives every time.

**Moat.** The measurements are deterministic computer-vision math, so results are
reproducible. Judges score Technical Depth on exactly this kind of grounding.

**Risk.** Real apps have thousands of screens; scope the demo to one flow and
state the crawl strategy as the follow-up.

## 11. Scrub: user-research session redactor

**Pain.** Meta's UXR teams record hundreds of sessions that cannot be shared
internally until PII is scrubbed: names, emails, faces, screens, plates. It is
slow manual labor on every single study.

**Chain.** Voice transcribes with full speaker attribution. Spark Open redacts PII
spans in the transcript. Deterministic pre-checks re-scan for emails, phones, and
names, and the output must come back clean. SAM blurs faces and screens across
the video, and verification re-runs on the finished artifact.

**Verifier.** The re-scan: a second deterministic pass over text and frames that
must report zero residuals. A redaction that cannot prove itself clean does not
ship.

**Demo.** Play 20 seconds of a raw session, then the same 20 seconds scrubbed:
names bleeped, faces blurred, with a "0 residuals found" certificate at the end.
Privacy tooling with a receipt.

**Moat.** Research-ops is invisible to outsiders but pure "Build for Your World,"
with a privacy story Meta loves to tell about itself.

**Risk.** Over-redaction kills utility; show the tuning (entity types per study)
as a feature, not a footnote.

## 12. ReframeGuard: vertical reframe verification

**Pain.** Every horizontal video Meta serves gets auto-reframed to vertical for
Reels and Stories. When the crop drifts off the subject, the clip dies silently
and nobody knows which reframes failed.

**Chain.** SAM tracks the subject across the original and the cut. Deterministic
geometry computes subject-in-frame percentage per second. Spark Open narrates the
failures and suggests reframe keyframes. Image previews the corrected crop.

**Verifier.** Subject-in-frame percentage, computed from masks, per second of
output. Below threshold means the reframe failed, with the exact seconds cited.

**Demo.** Side by side: original tracking box steady, reframe drifting onto an
empty wall at 0:06, flagged red with the percentage collapsing. Then the
corrected crop holding 100 percent. Visual, instant, undeniable.

**Moat.** Video-infra QA is deeply Meta (Reels depend on it) and almost nobody
pitches infrastructure. The side-by-side makes the abstract concrete.

**Risk.** Subject definition gets ambiguous with multiple people. Scope the demo
to single-subject clips and name multi-subject as the extension.

## 13. PolicyPrecheck: full creative policy check

**Pain.** Advertisers submit video, audio, and copy together, and review checks
each in isolation. Violations that only exist in combination (a claim spoken
over a contradicting visual) sail through.

**Chain.** SAM segments frames for text overlays and product shots while Voice
transcribes the audio track. Spark Open checks the combined creative against
policy rules, with each rule evaluated on all three modalities. Failing rules get
frame citations and transcript quotes. Image drafts the compliant variant.

**Verifier.** Per-rule pass or fail with multimodal evidence: frame numbers plus
quoted spans. A rule passes only when all three modalities agree it does.

**Moat.** Ads review is core Meta revenue machinery, and multimodal policy
checking is exactly the "beyond basic wrappers" integration the rubric rewards.

**Demo.** Run a non-compliant creative: two rules pass quietly, the third fails
with the spoken claim quoted next to the contradicting frame. Then the fixed
variant passing all three.

**Risk.** Policy rules are long and boring to encode. Demo with three crisp rules
and present the rule engine as the scalable part.

## 14. HandoffEscrow: commitment tracking against merges

**Pain.** Standups produce "I will..." commitments that evaporate by Friday.
Managers chase them in threads; engineers resent the chase. Nobody connects the
spoken promise to the merged proof.

**Chain.** Voice diarizes the standup and extracts commitments per speaker. Spark
Spark Open files each one against the team's repo. Deterministic checks watch for
the matching merge: the commitment closes only when a linked diff lands.
Stale commitments age visibly on the team page.

**Verifier.** Git is the judge: a commitment is open until a merge references it.
No self-reported completion, no vibes. The ledger is the commit history.

**Demo.** Monday: "I will fix the retry backoff" filed under Ada. Wednesday: the
merged diff auto-closes it with a green check. One stale commitment from last
week glows amber. Accountability without a single status meeting.

**Moat.** Turns the standup-to-PR pipeline into an accountability loop with a
verifier nobody can game. Managers in the judging room will lean forward.

**Risk.** Commitment-to-diff matching needs care to avoid false links. Require
explicit linkage (branch name or ticket ID) rather than fuzzy matching.

---

## 15. BabelFish standups: multilingual standups with receipts

**Pain.** Meta's offices stand up in twenty languages, often mixed mid-sentence.
Monolingual summaries silently drop whoever spoke another language, usually the
people whose updates mattered most.

**Chain.** Voice transcribes with 25-language support and code-switching, plus
full speaker attribution. Spark Open drafts per-speaker talk-time stats and
translated action items in each speaker's own language. Deterministic checks
verify every action item quotes its source turn. Wonder polishes the digest.

**Verifier.** Quote coverage per language: every action item must cite the turn
it came from, and talk-time math must sum to the meeting length. Nobody's words
go missing without the numbers showing it.

**Demo.** Play a standup that switches between English, Spanish, and Hindi. The
digest lands with per-speaker talk time and three action items, each quoted in
its original language with translation beside it. Then show what a monolingual
summarizer produced from the same audio: one speaker vanished.

**Moat.** Built on Muse's genuinely distinctive differentiator (25 languages,
code-switching, 20-plus speakers in one pass). Almost nobody will exploit the
one capability the model page brags about.

**Risk.** Translation quality varies by pair; show the original quote next to
every translation so nothing hides behind the model's English.

## 16. WipeCert: data-wipe certificates per serial

**Pain.** Refurb and takeback programs live or die on proof that user data is
gone. Today that proof is a spreadsheet row typed by a human, which convinces
auditors of nothing.

**Chain.** Device diagnostics plus wipe-tool logs feed Spark Open, which assembles
a per-serial certificate: method, timestamp, operator, verification read. SAM
verifies the unit photographed matches the serial plate via OCR. Deterministic
checks require the wipe-log hash to verify before the certificate issues.

**Verifier.** Hash verification on the wipe log per serial. No hash, no
certificate. The certificate is only as real as its cryptography.

**Demo.** Wipe a unit, watch the certificate generate with method, timestamp,
and verified hash, then scan the serial to pull the certificate back up.
Auditors dream in this format.

**Moat.** Circular-economy hardware with cryptographic receipts. Frontier track
meets compliance, and the demo is a physical object changing state.

**Risk.** Needs cooperation from wipe-tool output formats. Define a narrow log
schema for the demo and present adapters as the scaling story.

## 17. CalibrationDue: calibration sticker watchdog

**Pain.** Lab and factory tools drift out of calibration silently. The due date
sits on a sticker nobody reads until an audit finds expired equipment behind
critical measurements.

**Chain.** Walkdown photos go to SAM, which localizes stickers and gauges.
Deterministic OCR reads the due dates. Date arithmetic flags expired and
soon-to-expire equipment with owner pings. Spark Open drafts the recalibration
schedule; Wonder narrates the risk per overdue tool.

**Verifier.** Date arithmetic against today per sticker. Expired is expired;
there is no model opinion involved, only reading and subtraction.

**Demo.** One walkdown photo with six gauges: four green with dates, one amber
("due in 9 days"), one red ("expired 41 days ago, last used Tuesday").
Embarrassment as a service, and every lab manager will want it.

**Moat.** Hilariously unglamorous, which is why nobody else will pitch it and
everyone in industry will recognize the pain. Deterministic to the bone.

**Risk.** Sticker OCR fails on glare and angles. Demo with clean fixtures and
show the reject-and-rephotograph loop as a feature.

## 18. PagerDedup: duplicate page clustering

**Pain.** One root cause pages five services, and five engineers start five
investigations in parallel. The dedup happens in a chat thread twenty minutes
later, after the duplicated work is already spent.

**Chain.** Voice diarizes the first minutes of each bridge while alert metadata
feeds Spark Open for similarity clustering. Deterministic checks require a
shared service-graph edge before two pages may merge, which keeps coincidental
simultaneous pages apart. Wonder drafts the merged bridge invite.

**Verifier.** The service-graph edge requirement: pages merge only with a proven
dependency path between them. Similarity proposes, the graph disposes.

**Demo.** Five pages fire at once across three services. The tool merges three
into one incident (graph path shown) and holds two apart (no shared edge).
Twenty minutes of duplicated war-room compressed into one screen.

**Moat.** On-call pain every judge recognizes, with a graph-theoretic verifier
that prevents the classic dedup failure mode: merging unrelated incidents.

**Risk.** Needs a believable service graph fixture. Build a small realistic
topology rather than a toy three-node demo.

## 19. SolderQA: solder-joint grading from board photos

**Pain.** Solder defects are the largest cause of early board failure, and human
inspection samples a fraction of joints at line speed. Bad joints ship inside
units nobody opens again until they fail in the field.

**Chain.** Board photos go to SAM, which segments every joint. Deterministic
vision code scores fillet shape, wetting, and bridging per joint. Spark Open
assembles the per-board rework list with cropped evidence. Wonder narrates
shift-level defect trends for the line lead.

**Verifier.** Per-joint scores against grade thresholds, with failing joints
circled on the photo. The verdict is geometry on pixels, reproducible by anyone
with the captures.

**Demo.** One board photo: forty joints boxed green in under a second, two
pulsing red with zoomed crops of the bridge and the cold joint. The whole
quality story in a single image.

**Moat.** Factory-floor computer vision with a deterministic verdict, aimed at
the defect class that actually kills hardware. Concrete, visual, unforgettable.

**Risk.** Joint appearance varies by board finish and lighting. Calibrate on the
demo fixture and disclose the calibration, same discipline as TorqueSeal.

**Score.** Impact 7, Tooling 8, Demo 8, TechDepth 9 = 79. Graded
post-sift; promoted over DeadPixelMap (74) on demo immediacy and line relevance.

---

## 20. RunbookFromWreckage: runbooks proven in a sandbox

**Pain.** Every SEV produces lessons, and the runbook gets updated by hand weeks
later by someone reconstructing from memory. Half the steps are stale on arrival,
and nobody discovers it until the next incident, when a dead step wastes
minutes that matter.

**Chain.** Resolved SEV timelines and bridge transcripts feed Spark Open, which
drafts the updated runbook step by step. Wonder executes every step in a staging
sandbox via computer-use. Steps that fail are cut or rewritten on the spot, and
the runbook that ships is the one that just ran clean.

**Verifier.** Sandbox execution: each step must succeed in staging before it
earns a place in the runbook. The published runbook carries its last green run
timestamp. A step nobody watched succeed does not ship.

**Demo.** Take last month's SEV timeline, generate the runbook, and watch each
step execute live in the sandbox: nine green checks, one red step that gets
rewritten and re-run to green. The runbook writes itself and proves itself in
the same motion.

**Moat.** Verifiable computer-use pointed at the most hated artifact in ops: the
stale runbook. Deterministic proof replaces tribal knowledge.

**Risk.** Sandbox fidelity limits what steps can be proven. Scope the demo to
CLI and API steps, and mark interactive steps as witnessed rather than proven.



