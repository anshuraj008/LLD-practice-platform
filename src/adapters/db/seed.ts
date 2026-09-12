import { RelationalDatabase } from './database';
import { DEFAULT_LLD_RUBRIC_CRITERIA } from '../../domain/types/rubric';
import crypto from 'crypto';

export function runSeed() {
  const db = RelationalDatabase.getInstance();

  console.log('🌱 Seeding database...');

  // Keep the reviewer-facing demo history small and reproducible.
  db.resetUserHistory('user_alice');

  // 1. Seed Demo Users
  const demoUsers = [
    {
      id: 'user_alice',
      name: 'Alice Developer',
      email: 'alice@cipherschools.practice',
      createdAt: '2026-09-01T10:00:00.000Z',
    },
    {
      id: 'user_bob',
      name: 'Bob Systems',
      email: 'bob@cipherschools.practice',
      createdAt: '2026-09-02T10:00:00.000Z',
    },
  ];

  for (const u of demoUsers) {
    db.upsertUser(u);
  }

  // 2. Seed Default Rubric
  const defaultRubric = {
    id: 'rubric_v1',
    name: 'Standard LLD Rubric v1',
    version: '1.0.0',
    criteriaJson: JSON.stringify(DEFAULT_LLD_RUBRIC_CRITERIA),
  };
  db.upsertRubric(defaultRubric);

  // 3. Seed 4 Core LLD Problems
  const seedProblems = [
    {
      id: 'prob_parking_lot',
      slug: 'parking-lot',
      title: 'Design an Automated Multi-Floor Parking Lot System',
      difficulty: 'MEDIUM' as const,
      description:
        'Design a clean, modular object-oriented architecture for an automated multi-floor parking lot system. The system manages multiple vehicle types (Motorcycle, Car, Truck, EV), dynamic spot allocation based on vehicle size and proximity, real-time availability boards on each floor, automated entry/exit ticketing, and flexible fee calculation strategies (hourly, flat, EV charging surcharge).',
      requirementsJson: JSON.stringify([
        {
          id: 'req_1',
          category: 'functional',
          description: 'Support multi-floor capacity with multiple entry and exit gates.',
        },
        {
          id: 'req_2',
          category: 'functional',
          description:
            'Assign parking spots based on vehicle type (Compact, Large, Motorcycle, EV) using nearest-available strategy.',
        },
        {
          id: 'req_3',
          category: 'functional',
          description:
            'Issue an immutable parking ticket on entry and calculate payment dynamically on exit via pluggable pricing strategies.',
        },
        {
          id: 'req_4',
          category: 'non-functional',
          description:
            'Ensure thread-safe spot allocation and avoid race conditions when multiple gates admit vehicles simultaneously.',
        },
        {
          id: 'req_5',
          category: 'constraint',
          description:
            'Do not hardcode parking fee calculation directly inside Ticket or Gate classes; use Strategy pattern.',
        },
      ]),
      rubricId: 'rubric_v1',
      isActive: true,
      tagsJson: JSON.stringify(['OOP', 'Strategy Pattern', 'Concurrency', 'State Management']),
      estimatedMinutes: 45,
      createdAt: '2026-09-01T00:00:00.000Z',
    },
    {
      id: 'prob_vending_machine',
      slug: 'vending-machine',
      title: 'Design a State-Driven Snack & Beverage Vending Machine',
      difficulty: 'EASY' as const,
      description:
        'Design an automated vending machine supporting inventory selection, multiple payment forms (Cash, Card, UPI), state transitions (Idle, HasMoney, Dispensing, OutOfStock, Cancelled), change calculation with coin/bill denomination tracking, and safe transaction rollbacks.',
      requirementsJson: JSON.stringify([
        {
          id: 'req_vm_1',
          category: 'functional',
          description:
            'Model strict state transitions using the State Pattern: Idle -> HasMoney -> Dispensing -> Idle, and handle refund on cancel.',
        },
        {
          id: 'req_vm_2',
          category: 'functional',
          description:
            'Support inventory rack tracking with individual item pricing, quantity, and rack code lookup (e.g., A1, B3).',
        },
        {
          id: 'req_vm_3',
          category: 'functional',
          description: 'Calculate change accurately and dispense exact denominations or alert if exact change is unavailable.',
        },
        {
          id: 'req_vm_4',
          category: 'non-functional',
          description: 'Atomic inventory deduction upon successful payment confirmation to prevent double dispense.',
        },
      ]),
      rubricId: 'rubric_v1',
      isActive: true,
      tagsJson: JSON.stringify(['State Pattern', 'Inventory Management', 'State Machine']),
      estimatedMinutes: 35,
      createdAt: '2026-09-01T00:00:00.000Z',
    },
    {
      id: 'prob_elevator_system',
      slug: 'elevator-system',
      title: 'Design an Intelligent Multi-Car Elevator Dispatcher',
      difficulty: 'HARD' as const,
      description:
        'Design a high-throughput elevator dispatching system for a 40-floor commercial building with N elevator cars. The system handles external floor hall calls (Up/Down) and internal elevator cabin floor requests, optimising wait times using configurable dispatch algorithms (SCAN/LOOK, Nearest Car, Energy Saver).',
      requirementsJson: JSON.stringify([
        {
          id: 'req_el_1',
          category: 'functional',
          description:
            'Support N elevator cars operating concurrently across M floors with directional motion (UP, DOWN, IDLE, MAINTENANCE).',
        },
        {
          id: 'req_el_2',
          category: 'functional',
          description:
            'Separate External Hall Call buttons from Internal Destination Car Panels, routed through an ElevatorController.',
        },
        {
          id: 'req_el_3',
          category: 'functional',
          description:
            'Implement pluggable DispatchStrategy to route incoming requests to optimal elevator cars (e.g. SCAN/LOOK algorithm).',
        },
        {
          id: 'req_el_4',
          category: 'non-functional',
          description:
            'Handle safety interlocks: door sensors, overweight limit detection, emergency stop, and fire alarm override.',
        },
      ]),
      rubricId: 'rubric_v1',
      isActive: true,
      tagsJson: JSON.stringify(['Dispatcher', 'Strategy Pattern', 'State Pattern', 'Scheduling']),
      estimatedMinutes: 60,
      createdAt: '2026-09-01T00:00:00.000Z',
    },
    {
      id: 'prob_library_management',
      slug: 'library-management',
      title: 'Design a Digital Library Management & Fine System',
      difficulty: 'MEDIUM' as const,
      description:
        'Design an extensible Library Management System that supports book search across title/author/subject/ISBN, barcode check-in/checkout, active reservations with waitlists, membership types (Student, Faculty), and dynamic fine policy calculation for overdue returns.',
      requirementsJson: JSON.stringify([
        {
          id: 'req_lib_1',
          category: 'functional',
          description:
            'Separate abstract Book metadata (Title, Author, ISBN) from physical BookItem copies (Barcode, RackLocation, Status).',
        },
        {
          id: 'req_lib_2',
          category: 'functional',
          description:
            'Allow members to checkout books up to member-specific limits (e.g. 5 for Student, 10 for Faculty) and reserve lent copies.',
        },
        {
          id: 'req_lib_3',
          category: 'functional',
          description:
            'Calculate late return fines using pluggable FineStrategy based on days overdue and member type.',
        },
        {
          id: 'req_lib_4',
          category: 'non-functional',
          description:
            'Thread-safe reservation queue management when multiple members attempt to reserve the same popular title.',
        },
      ]),
      rubricId: 'rubric_v1',
      isActive: true,
      tagsJson: JSON.stringify(['Domain Modeling', 'Fine Strategy', 'Inventory Copy Management']),
      estimatedMinutes: 45,
      createdAt: '2026-09-01T00:00:00.000Z',
    },
  ];

  for (const p of seedProblems) {
    db.upsertProblem(p);
  }

  // 4. Seed 2 Realistic Historical Attempts for Alice on Parking Lot
  const attempt1Id = 'att_alice_parking_01';
  const submission1Id = 'sub_alice_parking_01';
  const eval1Id = 'eval_alice_parking_01';

  const draft1 = {
    assumptions:
      'Single entrance gate and 2 floors. All vehicles are treated as standard cars or motorcycles. Payment is handled strictly in cash at exit gate.',
    classes: [
      {
        name: 'ParkingLot',
        responsibility: 'Monitors all parking spots and gates, handles user entry and payment.',
      },
      {
        name: 'ParkingSpot',
        responsibility: 'Contains spot number, floor, and occupied boolean flag.',
      },
      {
        name: 'Vehicle',
        responsibility: 'Contains license plate string and type.',
      },
      {
        name: 'Ticket',
        responsibility: 'Stores vehicle plate, entry time, and parking fee.',
      },
    ],
    relationships: 'ParkingLot has many ParkingSpots and Tickets. Vehicle is parked in ParkingSpot.',
    mainFlow:
      '1. Car arrives at gate.\n2. ParkingLot finds first spot where isOccupied is false.\n3. Ticket is created with current timestamp.\n4. When leaving, ParkingLot calculates hours * $5 and marks spot empty.',
    edgeCases: 'What happens if parking lot is full: return null ticket.',
    tradeOffs:
      'Kept simple with all logic in ParkingLot. Did not use design patterns to keep code minimal.',
  };

  db.upsertAttempt({
    id: attempt1Id,
    userId: 'user_alice',
    problemId: 'prob_parking_lot',
    status: 'SUBMITTED',
    draftJson: JSON.stringify(draft1),
    createdAt: '2026-09-05T10:15:00.000Z',
    updatedAt: '2026-09-05T10:30:00.000Z',
    submittedAt: '2026-09-05T10:30:00.000Z',
  });

  db.upsertSubmission({
    id: submission1Id,
    attemptId: attempt1Id,
    format: 'structured-text',
    payloadJson: JSON.stringify({ format: 'structured-text', ...draft1 }),
    contentHash: crypto.createHash('sha256').update(JSON.stringify(draft1)).digest('hex'),
    idempotencyKey: '00000000-0000-0000-0000-000000000001',
    createdAt: '2026-09-05T10:30:00.000Z',
  });

  db.upsertEvaluation({
    id: eval1Id,
    submissionId: submission1Id,
    status: 'COMPLETED',
    evaluatorKind: 'gemini-1.5-pro',
    evaluatorVersion: '1.0.0',
    rubricVersion: '1.0.0',
    overallScore: 63,
    summary:
      'The submission demonstrates a working initial model with basic spot tracking and ticketing. However, ParkingLot acts as a God class coupling entry gates, spot allocation, fee calculation, and payment. Encapsulation is weak, and pricing is hardcoded without strategy extensibility.',
    strengthsJson: JSON.stringify([
      'Clear separation of ParkingSpot entity with occupancy status',
      'Direct identification of basic parking ticket lifecycle',
    ]),
    nextAttemptFocusJson: JSON.stringify([
      'Decompose ParkingLot God class into EntryGate, ExitGate, ParkingFloor, and ParkingManager',
      'Extract FeeCalculationStrategy interface to support dynamic pricing models',
      'Address concurrent multi-gate race conditions during spot assignment',
    ]),
    errorCode: null,
    errorMessage: null,
    retryCount: 0,
    createdAt: '2026-09-05T10:30:05.000Z',
    completedAt: '2026-09-05T10:30:22.000Z',
  });

  const eval1Items = [
    {
      id: 'eval1_item_1',
      evaluationId: eval1Id,
      criterionId: 'requirement-understanding',
      score: 3,
      evidenceJson: JSON.stringify(['Single entrance gate and 2 floors', 'All vehicles are treated as standard cars']),
      concern: 'Over-simplified multi-floor dynamic vehicle type sizing requirements.',
      suggestion: 'Explicitly model diverse vehicle types (EV, Truck, Motorcycle) and corresponding spot types.',
      confidence: 95,
    },
    {
      id: 'eval1_item_2',
      evaluationId: eval1Id,
      criterionId: 'class-responsibilities',
      score: 3,
      evidenceJson: JSON.stringify(['ParkingLot monitors all spots and gates, handles entry and payment']),
      concern: 'ParkingLot violates Single Responsibility Principle by accumulating gate, payment, and spot search duties.',
      suggestion: 'Introduce EntryGate, ExitGate, and PaymentProcessor as separate domain classes.',
      confidence: 90,
    },
    {
      id: 'eval1_item_3',
      evaluationId: eval1Id,
      criterionId: 'coupling-cohesion',
      score: 3,
      evidenceJson: JSON.stringify(['Ticket stores vehicle plate, entry time, and parking fee']),
      concern: 'Ticket directly coupling to fee computation.',
      suggestion: 'Keep Ticket as an immutable value object; pass to FeeCalculator on exit.',
      confidence: 90,
    },
    {
      id: 'eval1_item_4',
      evaluationId: eval1Id,
      criterionId: 'encapsulation-interfaces',
      score: 3,
      evidenceJson: JSON.stringify(['ParkingSpot contains occupied boolean flag']),
      concern: 'No public methods to assign/vacate spot; exposes raw field modification.',
      suggestion: 'Encapsulate spot state behind assignVehicle(Vehicle) and vacate() methods.',
      confidence: 90,
    },
    {
      id: 'eval1_item_5',
      evaluationId: eval1Id,
      criterionId: 'abstraction-patterns',
      score: 2,
      evidenceJson: JSON.stringify(['Did not use design patterns to keep code minimal']),
      concern: 'Missed Opportunity to apply Strategy Pattern for spot allocation and fee calculation.',
      suggestion: 'Define SpotAssignmentStrategy and PricingStrategy interfaces.',
      confidence: 95,
    },
    {
      id: 'eval1_item_6',
      evaluationId: eval1Id,
      criterionId: 'extensibility',
      score: 3,
      evidenceJson: JSON.stringify(['calculates hours * $5']),
      concern: 'Adding EV charging or weekend pricing requires modifying ParkingLot source code.',
      suggestion: 'Inject pluggable FeeCalculationStrategy implementations into the PaymentService.',
      confidence: 92,
    },
    {
      id: 'eval1_item_7',
      evaluationId: eval1Id,
      criterionId: 'edge-cases-testability',
      score: 3,
      evidenceJson: JSON.stringify(['What happens if parking lot is full: return null ticket']),
      concern: 'Did not address concurrency race conditions when two gates allocate the same spot.',
      suggestion: 'Mention thread-safety synchronization or atomic test-and-set allocation per floor.',
      confidence: 90,
    },
    {
      id: 'eval1_item_8',
      evaluationId: eval1Id,
      criterionId: 'explanation-quality',
      score: 4,
      evidenceJson: JSON.stringify(['Kept simple with all logic in ParkingLot']),
      concern: 'Honest trade-off explanation, but lacks justification for architectural choices.',
      suggestion: 'Explain why specific abstractions were deferred and how they will scale.',
      confidence: 88,
    },
  ];
  db.setEvaluationItems(eval1Id, eval1Items);

  // Attempt 2: Refactored Attempt (Score: 91%)
  const attempt2Id = 'att_alice_parking_02';
  const submission2Id = 'sub_alice_parking_02';
  const eval2Id = 'eval_alice_parking_02';

  const draft2 = {
    assumptions:
      'Multi-floor structure with N floors and M entry/exit gates. Vehicles are categorized as Motorcycle, Compact, Large, and EV. Payment can be Cash, CreditCard, or Contactless.',
    classes: [
      {
        name: 'ParkingLot',
        responsibility: 'Singleton aggregate root managing floors, gates, and display boards.',
      },
      {
        name: 'ParkingFloor',
        responsibility: 'Maintains categorized spot collections (Compact, Large, EV) and local display board.',
      },
      {
        name: 'ParkingSpot',
        responsibility: 'Abstract base with assignVehicle(), vacate(), and isAvailable() state management.',
      },
      {
        name: 'EntryGate / ExitGate',
        responsibility: 'EntryGate dispenses Ticket via SpotAssignmentStrategy; ExitGate processes Payment via FeeCalculator.',
      },
      {
        name: 'SpotAssignmentStrategy',
        responsibility: 'Interface for nearest-to-entrance or optimal floor allocation strategy.',
      },
      {
        name: 'FeeCalculationStrategy',
        responsibility: 'Interface for HourlyPricingStrategy, FlatRateStrategy, and EVChargingSurchargeStrategy.',
      },
      {
        name: 'PaymentService',
        responsibility: 'Processes payment transactions through PaymentProcessor adapter.',
      },
    ],
    relationships:
      'ParkingLot has-many ParkingFloor and Gates. ParkingFloor has-many ParkingSpot. EntryGate depends on SpotAssignmentStrategy. ExitGate uses FeeCalculationStrategy and PaymentService. Ticket is created by EntryGate.',
    mainFlow:
      '1. Vehicle triggers EntryGate sensor.\n2. EntryGate queries SpotAssignmentStrategy for best available spot matching vehicle size.\n3. Spot is atomically reserved; immutable Ticket(id, spotId, vehicle, entryTime) is issued.\n4. DisplayBoard counts updated.\n5. On exit, Ticket presented to ExitGate; FeeCalculationStrategy calculates bill; Payment processed; Spot vacated.',
    edgeCases:
      '1. Concurrency: Thread-safe locking/atomic CAS on ParkingSpot allocation to prevent double-booking across gates.\n2. Lost Ticket: Fallback to MaxDailyFeeCalculationStrategy.\n3. EV Spot occupied by regular car: Gate validator rejects non-EV allocation.',
    tradeOffs:
      'Applied Strategy Pattern for allocation and fee calculation to allow runtime variation without modifying core entities. Retained synchronous payment processing in memory rather than distributed messaging.',
  };

  db.upsertAttempt({
    id: attempt2Id,
    userId: 'user_alice',
    problemId: 'prob_parking_lot',
    status: 'SUBMITTED',
    draftJson: JSON.stringify(draft2),
    createdAt: '2026-09-06T14:00:00.000Z',
    updatedAt: '2026-09-06T14:45:00.000Z',
    submittedAt: '2026-09-06T14:45:00.000Z',
  });

  db.upsertSubmission({
    id: submission2Id,
    attemptId: attempt2Id,
    format: 'structured-text',
    payloadJson: JSON.stringify({ format: 'structured-text', ...draft2 }),
    contentHash: crypto.createHash('sha256').update(JSON.stringify(draft2)).digest('hex'),
    idempotencyKey: '00000000-0000-0000-0000-000000000002',
    createdAt: '2026-09-06T14:45:00.000Z',
  });

  db.upsertEvaluation({
    id: eval2Id,
    submissionId: submission2Id,
    status: 'COMPLETED',
    evaluatorKind: 'gemini-1.5-pro',
    evaluatorVersion: '1.0.0',
    rubricVersion: '1.0.0',
    overallScore: 91,
    summary:
      'Excellent refactoring! The design cleanly decouples entry/exit workflows from spot state management. SpotAssignmentStrategy and FeeCalculationStrategy provide robust extensibility adhering to the Open/Closed Principle. Concurrency and lost ticket edge cases are explicitly addressed.',
    strengthsJson: JSON.stringify([
      'Clean domain decoupling with EntryGate, ExitGate, and ParkingFloor aggregates',
      'Proper use of Strategy Pattern for dynamic spot allocation and pricing',
      'Thoughtful concurrency handling with atomic spot reservation',
    ]),
    nextAttemptFocusJson: JSON.stringify([
      'Consider observer pattern or event emission for real-time DisplayBoard synchronization',
      'Formalize error status codes for hardware gate sensor failures',
    ]),
    errorCode: null,
    errorMessage: null,
    retryCount: 0,
    createdAt: '2026-09-06T14:45:05.000Z',
    completedAt: '2026-09-06T14:45:24.000Z',
  });

  const eval2Items = [
    {
      id: 'eval2_item_1',
      evaluationId: eval2Id,
      criterionId: 'requirement-understanding',
      score: 5,
      evidenceJson: JSON.stringify(['Multi-floor structure with N floors and M entry/exit gates', 'Motorcycle, Compact, Large, and EV']),
      concern: 'None. Comprehensive understanding of multi-floor and multi-vehicle constraints.',
      suggestion: 'Ready for production architecture.',
      confidence: 98,
    },
    {
      id: 'eval2_item_2',
      evaluationId: eval2Id,
      criterionId: 'class-responsibilities',
      score: 5,
      evidenceJson: JSON.stringify(['EntryGate dispenses Ticket', 'ExitGate processes Payment', 'ParkingFloor maintains categorized spots']),
      concern: 'Classes have crisp, cohesive responsibilities adhering strictly to Single Responsibility.',
      suggestion: 'Maintain this separation of concerns.',
      confidence: 95,
    },
    {
      id: 'eval2_item_3',
      evaluationId: eval2Id,
      criterionId: 'coupling-cohesion',
      score: 4,
      evidenceJson: JSON.stringify(['ExitGate uses FeeCalculationStrategy and PaymentService']),
      concern: 'Minor coupling between ExitGate and PaymentService.',
      suggestion: 'Can inject PaymentService via dependency injection or mediator.',
      confidence: 90,
    },
    {
      id: 'eval2_item_4',
      evaluationId: eval2Id,
      criterionId: 'encapsulation-interfaces',
      score: 5,
      evidenceJson: JSON.stringify(['assignVehicle(), vacate(), and isAvailable() state management']),
      concern: 'ParkingSpot encapsulation is robust with guarded transitions.',
      suggestion: 'Consider immutable value objects for Ticket and SpotCoordinates.',
      confidence: 94,
    },
    {
      id: 'eval2_item_5',
      evaluationId: eval2Id,
      criterionId: 'abstraction-patterns',
      score: 5,
      evidenceJson: JSON.stringify(['SpotAssignmentStrategy', 'FeeCalculationStrategy', 'PaymentProcessor adapter']),
      concern: 'Patterns are well-justified by explicit variation requirements.',
      suggestion: 'Keep patterns focused on actual variation points.',
      confidence: 95,
    },
    {
      id: 'eval2_item_6',
      evaluationId: eval2Id,
      criterionId: 'extensibility',
      score: 5,
      evidenceJson: JSON.stringify(['HourlyPricingStrategy, FlatRateStrategy, and EVChargingSurchargeStrategy']),
      concern: 'New pricing rules or allocation algorithms can be introduced without modifying existing gates.',
      suggestion: 'Extensibility model is complete and testable.',
      confidence: 96,
    },
    {
      id: 'eval2_item_7',
      evaluationId: eval2Id,
      criterionId: 'edge-cases-testability',
      score: 4,
      evidenceJson: JSON.stringify(['Thread-safe locking/atomic CAS on ParkingSpot allocation', 'Lost Ticket fallback']),
      concern: 'Good concurrency and fallback strategy coverage.',
      suggestion: 'Could also specify behavior when payment gateway times out at exit gate.',
      confidence: 92,
    },
    {
      id: 'eval2_item_8',
      evaluationId: eval2Id,
      criterionId: 'explanation-quality',
      score: 5,
      evidenceJson: JSON.stringify(['Applied Strategy Pattern for allocation and fee calculation to allow runtime variation']),
      concern: 'Clear, concise architectural trade-off justification.',
      suggestion: 'Great communication of engineering trade-offs.',
      confidence: 95,
    },
  ];
  db.setEvaluationItems(eval2Id, eval2Items);


  // Attempt 3: One compact vending-machine example for cross-problem history.
  const vendingAttemptId = 'att_alice_vending_01';
  const vendingSubmissionId = 'sub_alice_vending_01';
  const vendingEvaluationId = 'eval_alice_vending_01';
  const vendingDraft = {
    assumptions: 'The machine supports cash and card payments, one active customer transaction at a time, and inventory updates are persisted atomically.',
    classes: [
      { name: 'VendingMachine', responsibility: 'Coordinates selection, payment, dispensing, refunds, and state transitions for one customer transaction.' },
      { name: 'Inventory', responsibility: 'Tracks products, rack positions, quantities, and atomic stock deduction after payment.' },
      { name: 'PaymentProcessor', responsibility: 'Authorizes payment and issues refunds through interchangeable cash or card adapters.' },
      { name: 'MachineState', responsibility: 'Encapsulates valid transitions between Idle, HasMoney, Dispensing, and OutOfStock states.' },
    ],
    relationships: 'VendingMachine composes Inventory and delegates payment to PaymentProcessor. MachineState controls which commands are valid during a transaction.',
    mainFlow: '1. Customer selects a product. 2. Machine validates stock and price. 3. PaymentProcessor authorizes payment. 4. Inventory deducts stock atomically. 5. Machine dispenses the product and returns change.',
    edgeCases: 'Handle out-of-stock selection, payment timeout, insufficient change, cancellation before dispense, and an inventory race when two requests target the last item.',
    tradeOffs: 'The State pattern keeps transaction rules explicit, while PaymentProcessor adapters keep payment providers replaceable. The demo uses synchronous in-memory persistence for clarity.',
  };

  db.upsertAttempt({
    id: vendingAttemptId,
    userId: 'user_alice',
    problemId: 'prob_vending_machine',
    status: 'SUBMITTED',
    draftJson: JSON.stringify(vendingDraft),
    createdAt: '2026-09-07T11:00:00.000Z',
    updatedAt: '2026-09-07T11:35:00.000Z',
    submittedAt: '2026-09-07T11:35:00.000Z',
  });
  db.upsertSubmission({
    id: vendingSubmissionId,
    attemptId: vendingAttemptId,
    format: 'structured-text',
    payloadJson: JSON.stringify({ format: 'structured-text', ...vendingDraft }),
    contentHash: crypto.createHash('sha256').update(JSON.stringify(vendingDraft)).digest('hex'),
    idempotencyKey: '00000000-0000-0000-0000-000000000003',
    createdAt: '2026-09-07T11:00:00.000Z',
  });
  db.upsertEvaluation({
    id: vendingEvaluationId,
    submissionId: vendingSubmissionId,
    status: 'COMPLETED',
    evaluatorKind: 'gemini-1.5-pro',
    evaluatorVersion: '1.0.0',
    rubricVersion: '1.0.0',
    overallScore: 78,
    summary: 'A solid state-driven design with clear payment and inventory boundaries. Further detail on recovery and persistence would strengthen the design.',
    strengthsJson: JSON.stringify(['Clear State pattern usage', 'Atomic inventory responsibility', 'Replaceable payment boundary']),
    nextAttemptFocusJson: JSON.stringify(['Define durable recovery after a payment timeout', 'Specify exact change calculation behavior']),
    errorCode: null,
    errorMessage: null,
    retryCount: 0,
    createdAt: '2026-09-07T11:35:05.000Z',
    completedAt: '2026-09-07T11:35:22.000Z',
  });
  db.setEvaluationItems(
    vendingEvaluationId,
    DEFAULT_LLD_RUBRIC_CRITERIA.map((criterion, index) => ({
      id: `vending_eval_item_${index + 1}`,
      evaluationId: vendingEvaluationId,
      criterionId: criterion.id,
      score: index === 6 ? 3 : 4,
      evidenceJson: JSON.stringify(['State and responsibility boundaries are explicitly described.']),
      concern: index === 6 ? 'Recovery and failure-path testability could be more concrete.' : 'The design provides a clear, relevant boundary for this criterion.',
      suggestion: 'Add one concrete example covering the primary failure or extension path.',
      confidence: 88,
    }))
  );
  console.log('✅ Database seeded successfully!');
}

if (typeof require !== 'undefined' && require.main === module) {
  runSeed();
}
