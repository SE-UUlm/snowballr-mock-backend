import { User, UserRole, UserStatus } from "../grpc-gen/user";
import { ExampleData } from "../model";
import {
    MemberRole,
    PaperDecision,
    Project,
    Project_Member,
    Project_Paper,
    Project_Settings,
    ProjectStatus,
    ReviewDecisionMatrix,
    ReviewDecisionMatrix_Pattern,
    SnowballingType,
} from "../grpc-gen/project";
import { Review, ReviewDecision } from "../grpc-gen/review";
import { Criterion, CriterionCategory } from "../grpc-gen/criterion";
import { Author, Paper } from "../grpc-gen/paper";
import { getRandomItems, random } from "../random";
import { UserSettings } from "../grpc-gen/user_settings";
import assert from "node:assert";
import { makeReviewDecisionMatrixPattern } from "../util";

const NUMBER_OF_REVIEWS = 200;

const USERS: User[] = [
    {
        id: "alice.smith@example.com",
        email: "alice.smith@example.com",
        firstName: "Alice",
        lastName: "Smith",
        role: UserRole.DEFAULT,
        status: UserStatus.ACTIVE,
    },
    {
        id: "bob.jones@example.com",
        email: "bob.jones@example.com",
        firstName: "Bob",
        lastName: "Jones",
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
    },
    {
        id: "charlie.davis@example.com",
        email: "charlie.davis@example.com",
        firstName: "Charlie",
        lastName: "Davis",
        role: UserRole.DEFAULT,
        status: UserStatus.ACTIVE,
    },
    {
        id: "diana.martin@example.com",
        email: "diana.martin@example.com",
        firstName: "Diana",
        lastName: "Martin",
        role: UserRole.DEFAULT,
        status: UserStatus.DELETED,
    },
    {
        id: "edward.miller@example.com",
        email: "edward.miller@example.com",
        firstName: "Edward",
        lastName: "Miller",
        role: UserRole.DEFAULT,
        status: UserStatus.ACTIVE,
    },
    {
        id: "fiona.wilson@example.com",
        email: "fiona.wilson@example.com",
        firstName: "Fiona",
        lastName: "Wilson",
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
    },
    {
        id: "george.anderson@example.com",
        email: "george.anderson@example.com",
        firstName: "George",
        lastName: "Anderson",
        role: UserRole.DEFAULT,
        status: UserStatus.ACTIVE,
    },
    {
        id: "hannah.taylor@example.com",
        email: "hannah.taylor@example.com",
        firstName: "Hannah",
        lastName: "Taylor",
        role: UserRole.ADMIN,
        status: UserStatus.DELETED,
    },
    {
        id: "ian.thomas@example.com",
        email: "ian.thomas@example.com",
        firstName: "Ian",
        lastName: "Thomas",
        role: UserRole.DEFAULT,
        status: UserStatus.ACTIVE,
    },
    {
        id: "julia.clark@example.com",
        email: "julia.clark@example.com",
        firstName: "Julia",
        lastName: "Clark",
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
    },
    {
        id: "11",
        email: "kevin.roberts@example.com",
        firstName: "Kevin",
        lastName: "Roberts",
        role: UserRole.DEFAULT,
        status: UserStatus.ACTIVE,
    },
    {
        id: "laura.harris@example.com",
        email: "laura.harris@example.com",
        firstName: "Laura",
        lastName: "Harris",
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
    },
    {
        id: "michael.clarkson@example.com",
        email: "michael.clarkson@example.com",
        firstName: "Michael",
        lastName: "Clarkson",
        role: UserRole.DEFAULT,
        status: UserStatus.DELETED,
    },
    {
        id: "nina.evans@example.com",
        email: "nina.evans@example.com",
        firstName: "Nina",
        lastName: "Evans",
        role: UserRole.DEFAULT,
        status: UserStatus.ACTIVE,
    },
    {
        id: "oliver.white@example.com",
        email: "oliver.white@example.com",
        firstName: "Oliver",
        lastName: "White",
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
    },
    {
        id: "paula.thompson@example.com",
        email: "paula.thompson@example.com",
        firstName: "Paula",
        lastName: "Thompson",
        role: UserRole.DEFAULT,
        status: UserStatus.ACTIVE,
    },
    {
        id: "quentin.brown@example.com",
        email: "quentin.brown@example.com",
        firstName: "Quentin",
        lastName: "Brown",
        role: UserRole.ADMIN,
        status: UserStatus.DELETED,
    },
    {
        id: "rachel.lee@example.com",
        email: "rachel.lee@example.com",
        firstName: "Rachel",
        lastName: "Lee",
        role: UserRole.DEFAULT,
        status: UserStatus.ACTIVE,
    },
    {
        id: "steven.walker@example.com",
        email: "steven.walker@example.com",
        firstName: "Steven",
        lastName: "Walker",
        role: UserRole.DEFAULT,
        status: UserStatus.ACTIVE,
    },
    {
        id: "tina.adams@example.com",
        email: "tina.adams@example.com",
        firstName: "Tina",
        lastName: "Adams",
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
    },
];

const AVAILABLE_FETCHERS = [
    "arXiv API",
    "Semantic Scholar API",
    "PubMed API",
    "CrossRef API",
    "CORE API",
    "Springer Nature API",
    "Elsevier Scopus API",
    "IEEE Xplore API",
    "OpenCitations API",
    "Europe PMC API",
];

const PATTERN_2: ReviewDecisionMatrix_Pattern[] = [
    makeReviewDecisionMatrixPattern(2, 0, 0, PaperDecision.ACCEPTED),
    makeReviewDecisionMatrixPattern(0, 2, 0, PaperDecision.ACCEPTED),
    makeReviewDecisionMatrixPattern(1, 1, 0, PaperDecision.IN_REVIEW),
    makeReviewDecisionMatrixPattern(1, 0, 1, PaperDecision.IN_REVIEW),
    makeReviewDecisionMatrixPattern(0, 1, 1, PaperDecision.DECLINED),
    makeReviewDecisionMatrixPattern(0, 0, 2, PaperDecision.IN_REVIEW),
];

const PATTERN_3: ReviewDecisionMatrix_Pattern[] = [
    makeReviewDecisionMatrixPattern(3, 0, 0, PaperDecision.ACCEPTED),
    makeReviewDecisionMatrixPattern(2, 1, 0, PaperDecision.ACCEPTED),
    makeReviewDecisionMatrixPattern(1, 2, 0, PaperDecision.DECLINED),
    makeReviewDecisionMatrixPattern(1, 1, 1, PaperDecision.IN_REVIEW),
    makeReviewDecisionMatrixPattern(1, 0, 2, PaperDecision.ACCEPTED),
    makeReviewDecisionMatrixPattern(0, 1, 2, PaperDecision.DECLINED),
];

const reviewDecisionMatrices: ReviewDecisionMatrix[] = [
    {
        numberOfReviewers: 2,
        patterns: [PATTERN_2[0], PATTERN_2[1], PATTERN_2[2]],
    },
    {
        numberOfReviewers: 2,
        patterns: [PATTERN_2[0], PATTERN_2[2], PATTERN_2[4]],
    },
    {
        numberOfReviewers: 2,
        patterns: [PATTERN_2[0], PATTERN_2[2], PATTERN_2[3], PATTERN_2[4]],
    },
    {
        numberOfReviewers: 2,
        patterns: [PATTERN_2[0], PATTERN_2[1], PATTERN_2[2], PATTERN_2[3]],
    },
    {
        numberOfReviewers: 2,
        patterns: [PATTERN_2[0], PATTERN_2[3], PATTERN_2[4]],
    },
    {
        numberOfReviewers: 3,
        patterns: [PATTERN_3[0], PATTERN_3[2], PATTERN_3[3]],
    },
    {
        numberOfReviewers: 3,
        patterns: [PATTERN_3[0], PATTERN_3[1], PATTERN_3[2], PATTERN_3[3]],
    },
    {
        numberOfReviewers: 3,
        patterns: [PATTERN_3[3], PATTERN_3[4], PATTERN_3[5]],
    },
    {
        numberOfReviewers: 3,
        patterns: [PATTERN_3[2], PATTERN_3[3], PATTERN_3[4]],
    },
    {
        numberOfReviewers: 3,
        patterns: [PATTERN_3[2], PATTERN_3[3], PATTERN_3[4], PATTERN_3[5]],
    },
];

const projectSettings: Project_Settings[] = [];
for (let i = 0; i < 7; i++) {
    projectSettings.push({
        similarityThreshold: random() * 0.2 + 0.5,
        decisionMatrix: getRandomItems(reviewDecisionMatrices)[0],
        fetcherApis: getRandomItems(AVAILABLE_FETCHERS, 2, 7),
        snowballingType:
            random() < 0.7
                ? SnowballingType.BOTH
                : random() < 0.5
                  ? SnowballingType.FORWARD
                  : SnowballingType.BACKWARD,
        reviewMaybeAllowed: random() < 0.7,
    });
}

const projects: Project[] = [];
const PROJECT_NAMES = [
    "Innovative Survey for Education",
    "Systematic Study in Healthcare",
    "Comprehensive Review of Sustainability",
    "Dynamic Analysis for Automation",
    "Focused Protocol on AI",
    "Recent Investigation in Robotics",
    "Critical Framework on Climate Change",
    "Combinatorial Study for Education",
    "Global Survey of Sustainability",
    "Efficient Review on AI",
    "Innovative Methodology in Bioinformatics",
    "Comprehensive Framework for Automation",
    "Dynamic Assessment on Data Privacy",
    "Recent Approach in Robotics",
    "Systematic Investigation for Education",
    "Combinatorial Review on Climate Change",
    "Global Study for Bioinformatics",
    "Focused Protocol on Sustainability",
    "Critical Approach for Automation",
    "Efficient Review in Healthcare",
];
for (const [index, projectName] of PROJECT_NAMES.entries()) {
    const stage: number = Math.floor(random() * 2.5);

    projects.push({
        id: `${index}`,
        name: projectName,
        status:
            random() < 0.7
                ? ProjectStatus.ACTIVE
                : random() < 0.5
                  ? ProjectStatus.ARCHIVED
                  : ProjectStatus.DELETED,
        currentStage: BigInt(stage),
        maxStage: BigInt(random() < 0.6 ? stage : stage + 1),
        settings: getRandomItems(projectSettings)[0],
    });
}
const projectMembers: { projectId: string; members: Project_Member[] }[] = [];
for (const project of projects) {
    const members = getRandomItems(USERS, 2, 6).map((user) => ({
        user: user,
        role: MemberRole.DEFAULT,
    }));
    members[0].role = MemberRole.ADMIN;

    projectMembers.push({
        projectId: project.id,
        members: members,
    });
}

const CRITERIA: Criterion[] = [
    {
        id: "1",
        tag: "I1",
        name: "Title Relevance",
        description:
            "The title of the paper must be relevant to the topic of the systematic review.",
        category: CriterionCategory.INCLUSION,
    },
    {
        id: "2",
        tag: "I2",
        name: "Abstract Relevance",
        description:
            "The abstract of the paper should align with the inclusion criteria and cover the main aspects of the research topic.",
        category: CriterionCategory.INCLUSION,
    },
    {
        id: "3",
        tag: "I3",
        name: "Publication Year",
        description:
            "The paper must have been published within the last 10 years to ensure the research is current.",
        category: CriterionCategory.INCLUSION,
    },
    {
        id: "4",
        tag: "I4",
        name: "Peer-Reviewed",
        description:
            "The paper must be peer-reviewed to ensure the quality and validity of the research.",
        category: CriterionCategory.INCLUSION,
    },
    {
        id: "5",
        tag: "I5",
        name: "Language",
        description:
            "The paper must be written in English or other predefined languages to be included.",
        category: CriterionCategory.INCLUSION,
    },
    {
        id: "6",
        tag: "I6",
        name: "Research Design",
        description:
            "The paper must present original research (e.g., experimental, observational, case study, etc.) rather than reviews or theoretical papers.",
        category: CriterionCategory.INCLUSION,
    },
    {
        id: "7",
        tag: "I7",
        name: "Study Population",
        description:
            "The paper must include a specific human, animal, or ecological population relevant to the systematic review's scope.",
        category: CriterionCategory.INCLUSION,
    },
    {
        id: "8",
        tag: "I8",
        name: "Intervention Type",
        description:
            "The paper must focus on a specific intervention or treatment type that matches the review's inclusion criteria.",
        category: CriterionCategory.INCLUSION,
    },
    {
        id: "9",
        tag: "HE9",
        name: "Non-English Language",
        description:
            "The paper is excluded if it is not written in English or other predefined languages.",
        category: CriterionCategory.HARD_EXCLUSION,
    },
    {
        id: "10",
        tag: "HE10",
        name: "Non-Peer-Reviewed",
        description:
            "The paper is excluded if it is not peer-reviewed, as it may not meet the required research quality.",
        category: CriterionCategory.HARD_EXCLUSION,
    },
    {
        id: "11",
        tag: "HE11",
        name: "Duplicate Publication",
        description:
            "The paper is excluded if it is a duplicate of another included paper or presents the same data from the same research study.",
        category: CriterionCategory.HARD_EXCLUSION,
    },
    {
        id: "12",
        tag: "E12",
        name: "Research Type Not Relevant",
        description:
            "The paper is excluded if it does not contain original research (e.g., reviews, theoretical papers, or opinion articles).",
        category: CriterionCategory.EXCLUSION,
    },
    {
        id: "13",
        tag: "E13",
        name: "Out of Scope",
        description:
            "The paper is excluded if it does not fit within the defined scope or objectives of the systematic review.",
        category: CriterionCategory.EXCLUSION,
    },
    {
        id: "14",
        tag: "E14",
        name: "Methodological Issues",
        description:
            "The paper is excluded if it contains significant methodological flaws that compromise the validity of the results.",
        category: CriterionCategory.EXCLUSION,
    },
    {
        id: "15",
        tag: "E15",
        name: "Non-Relevant Population",
        description:
            "The paper is excluded if the population studied is not relevant to the scope of the systematic review.",
        category: CriterionCategory.EXCLUSION,
    },
];

const AUTHORS: Author[] = [
    { firstName: "John", lastName: "Doe", orcid: "0000-0002-1825-0097" },
    { firstName: "Alice", lastName: "Smith", orcid: "0000-0003-1415-9267" },
    { firstName: "Bob", lastName: "Johnson", orcid: "0000-0001-2345-6789" },
    { firstName: "Catherine", lastName: "Williams", orcid: "0000-0002-9876-5432" },
    { firstName: "David", lastName: "Brown", orcid: "0000-0001-5567-1234" },
    { firstName: "Eve", lastName: "Jones", orcid: "0000-0003-5647-8901" },
    { firstName: "Frank", lastName: "Miller", orcid: "0000-0002-2345-6789" },
    { firstName: "Grace", lastName: "Davis", orcid: "0000-0001-3456-7890" },
    { firstName: "Henry", lastName: "Garcia", orcid: "0000-0002-5432-1098" },
    { firstName: "Ivy", lastName: "Martinez", orcid: "0000-0003-8765-4321" },
    { firstName: "Jack", lastName: "Hernandez", orcid: "0000-0001-8765-4321" },
    { firstName: "Kathy", lastName: "Lopez", orcid: "0000-0002-7654-3210" },
    { firstName: "Luis", lastName: "Gonzalez", orcid: "0000-0003-8765-2109" },
    { firstName: "Mia", lastName: "Wilson", orcid: "0000-0001-6543-2109" },
    { firstName: "Noah", lastName: "Anderson", orcid: "0000-0002-6543-0987" },
    { firstName: "Olivia", lastName: "Thomas", orcid: "0000-0001-5432-1098" },
    { firstName: "Paul", lastName: "Taylor", orcid: "0000-0003-5432-1098" },
    { firstName: "Quincy", lastName: "Moore", orcid: "0000-0001-4321-0987" },
    { firstName: "Rachel", lastName: "Jackson", orcid: "0000-0002-4321-9876" },
    { firstName: "Sam", lastName: "White", orcid: "0000-0003-3210-9876" },
];

const PAPER_TITLES = [
    "Exploring the Universe of AI",
    "Quantum Computing: An Overview",
    "The Role of Data in Modern Research",
    "Artificial Intelligence in Healthcare",
    "The Ethics of Artificial Intelligence",
    "Blockchain Technology: A New Era of Security",
    "Renewable Energy: Global Perspectives",
    "The Future of Transportation",
    "Machine Learning in Financial Systems",
    "The Internet of Things: Implications for Privacy",
    "Advances in Deep Learning",
    "The Impact of AI on Employment",
    "Cybersecurity in the Age of IoT",
    "The Role of Big Data in Healthcare",
    "Augmented Reality: Shaping the Future of Education",
    "Sustainable Development through Renewable Energy",
    "Neuroscience and the Human Brain",
    "5G Networks: Opportunities and Challenges",
    "The Future of Space Exploration",
    "The Ethics of Gene Editing",
    "Artificial Intelligence in Business",
    "Smart Cities and Urban Development",
    "The Impact of Climate Change on Agriculture",
    "Biotechnology in Environmental Protection",
    "The Role of Artificial Intelligence in Healthcare Diagnostics",
    "The Impact of Automation on Society",
    "Data Privacy in the Digital Age",
    "The Role of AI in Healthcare Administration",
    "Quantum Computing: The Next Frontier",
    "Blockchain in Finance: A Revolutionary Technology",
    "The Future of Autonomous Vehicles",
    "The Rise of Virtual Reality in Entertainment",
    "Energy Storage Solutions for a Sustainable Future",
    "AI in Healthcare: Opportunities and Challenges",
    "The Role of Biotechnology in Sustainable Agriculture",
    "Climate Change and Water Scarcity: A Global Challenge",
    "Machine Learning in Financial Forecasting",
    "The Impact of Artificial Intelligence on Creativity",
    "Digital Transformation in Healthcare Systems",
    "Robotic Process Automation: Revolutionizing Business Operations",
    "Artificial Intelligence for Drug Discovery",
    "The Evolution of E-Commerce in the Digital Age",
    "Wearable Technology: Health Monitoring and Beyond",
    "The Promise and Perils of Autonomous Systems",
];
const PAPER_DOIS = [
    "10.1234/abcd.5678",
    "",
    "10.2345/xyz.9876",
    "10.5432/lmn.1234",
    "",
    "10.6789/pqr.4321",
    "",
    "10.2468/uvw.1357",
    "",
    "10.3456/stu.7689",
    "10.1111/abc.1234",
    "",
    "10.3457/xyz.9876",
    "",
    "10.2345/abc.1234",
    "",
    "10.4568/xyz.4567",
    "",
    "",
    "10.6547/xyz.2345",
    "",
    "10.9876/abc.3456",
    "",
    "10.1122/xyz.5678",
    "",
    "10.3459/pqr.3456",
    "",
    "10.0987/xyz.6543",
    "",
    "10.6723/xyz.1290",
    "",
    "10.9875/abc.6543",
    "",
    "10.5468/xyz.2347",
    "",
    "10.7852/abc.1234",
    "",
    "10.8976/xyz.5678",
    "",
    "10.5627/abc.3124",
    "",
    "10.4312/abc.2111",
    "",
    "10.7589/xyz.7777",
];

const PAPER_ABSTRACTS = [
    "Artificial Intelligence (AI) has been a subject of research for decades. It has revolutionized multiple fields, from healthcare to finance. However, there are still significant challenges in terms of ethics and implementation. AI systems require vast datasets to train, and biases in those datasets can lead to unfair results. The future of AI promises more intuitive machines, but there is a need for further exploration of its social impacts. With advancements in machine learning, AI continues to evolve. Yet, the boundaries of what AI can achieve remain unclear. In this paper, we discuss both the current state and future possibilities of AI technologies. We also provide a roadmap for overcoming its limitations.",
    "Quantum computing represents a major shift in the way we approach computation. Unlike classical computers, quantum computers harness the principles of quantum mechanics. These systems use qubits instead of traditional bits, offering potential advantages in solving complex problems. Researchers have already demonstrated quantum supremacy in specific tasks. However, quantum computing is still in its infancy, with many technical challenges remaining. Scalability, error rates, and qubit coherence time are among the issues that need to be addressed. Despite these challenges, the potential impact on fields like cryptography and drug discovery is enormous. This paper outlines the state of quantum computing and the hurdles it faces on its path to widespread adoption.",
    "In modern research, data plays a crucial role in driving discoveries. The availability of vast amounts of data has changed how research is conducted across many domains. However, data alone is not enough; it must be interpreted correctly. Researchers need to be equipped with tools to handle large datasets, such as machine learning algorithms and statistical models. This paper explores how data science has impacted various research fields, including biology, physics, and economics. The challenges of data privacy and security are also discussed. Furthermore, the paper highlights the ethical considerations in data collection and usage. The future of research relies heavily on how data is handled and analyzed.",
    "The application of AI in healthcare has seen significant growth in recent years. From diagnostic tools to personalized treatment plans, AI is revolutionizing medical practices. However, implementing AI solutions in healthcare presents unique challenges. Data privacy and security remain top concerns, especially given the sensitive nature of medical information. Moreover, the integration of AI into existing healthcare systems requires substantial investment. Despite these hurdles, the potential to improve patient outcomes is immense. AI-powered devices can analyze medical images with remarkable accuracy. In this paper, we explore the state of AI in healthcare and the barriers to its full integration.",
    "",
    "Blockchain technology has emerged as a revolutionary way to secure digital transactions. It ensures data integrity through decentralized systems and cryptographic algorithms. The promise of blockchain goes beyond cryptocurrencies, with applications in supply chain management, healthcare, and voting systems. However, the technology is not without its challenges. Issues such as scalability, energy consumption, and regulatory concerns need to be addressed. In this paper, we review the evolution of blockchain technology and its current applications. We also discuss the potential for blockchain to disrupt traditional industries and the barriers to its widespread adoption. Despite the challenges, blockchain remains a promising technology with wide-reaching implications.",
    "Renewable energy sources have gained significant attention as a response to the global energy crisis. Solar, wind, and hydropower are leading the charge in reducing dependence on fossil fuels. However, the transition to renewable energy is not without challenges. Factors such as cost, infrastructure, and political will are key barriers to implementation. This paper examines the current state of renewable energy around the world and the policy measures that support it. It also explores technological advancements that have made renewable energy more efficient and affordable. As the global demand for energy continues to rise, renewable energy may play a crucial role in mitigating climate change.",
    "",
    "",
    "",
    "Deep learning has emerged as one of the most influential techniques in machine learning. With the development of sophisticated neural networks, deep learning has revolutionized fields like computer vision, natural language processing, and speech recognition. This paper explores recent advancements in deep learning architectures, including convolutional and recurrent neural networks. It also discusses the applications of deep learning in various industries, along with the challenges that remain in terms of data availability, training costs, and model interpretability.",
    "Artificial intelligence is reshaping the labor market by automating jobs traditionally performed by humans. This paper examines the potential impact of AI technologies on employment across different sectors, from manufacturing to healthcare. While AI promises to improve efficiency and reduce costs, it also raises concerns about job displacement and economic inequality. The paper discusses the need for new policies and strategies to address the societal implications of AI-driven job changes.",
    "The rapid growth of the Internet of Things (IoT) has created new opportunities for connectivity, but it also presents significant cybersecurity challenges. This paper explores the security risks posed by the proliferation of connected devices and offers recommendations for improving IoT security. Topics discussed include encryption, device authentication, and secure data transmission protocols. The paper emphasizes the importance of collaboration between industries, governments, and consumers to safeguard the growing network of connected devices.",
    "Big data analytics is transforming the healthcare industry by enabling more personalized and effective treatments. This paper reviews the current state of big data in healthcare, from patient records to real-time monitoring. It explores how big data tools are being used to improve diagnostics, treatment planning, and patient care. The paper also addresses the ethical and privacy concerns that arise when dealing with sensitive health data, and proposes ways to overcome these challenges.",
    "Augmented reality (AR) is poised to revolutionize the educational landscape by offering immersive and interactive learning experiences. This paper investigates the potential applications of AR in classrooms, such as virtual field trips, 3D models of complex concepts, and real-time collaboration. The paper also discusses the challenges of implementing AR in education, including cost, infrastructure, and teacher training.",
    "The transition to renewable energy is a critical part of global efforts to combat climate change. This paper examines the role of renewable energy in achieving sustainable development goals, with a focus on solar, wind, and hydroelectric power. It explores the environmental, economic, and social benefits of renewable energy, as well as the challenges related to energy storage, grid integration, and political support.",
    "Recent advancements in neuroscience have provided deeper insights into the human brain and its functioning. This paper reviews current research on brain-computer interfaces, neural plasticity, and cognitive enhancement. It explores the implications of these advancements for fields such as medicine, psychology, and artificial intelligence. The paper also highlights the ethical considerations of manipulating the human brain through technology.",
    "",
    "Space exploration has reached new heights with the development of private space travel companies, such as SpaceX and Blue Origin. This paper reviews the advancements in space technology, including reusable rockets and space tourism. It also discusses the potential for human colonization of other planets and the ethical considerations surrounding the exploration and exploitation of outer space.",
    "Gene editing technologies, such as CRISPR, have made it possible to manipulate the DNA of living organisms with unprecedented precision. This paper explores the ethical implications of gene editing, including its potential to eliminate genetic diseases, its use in enhancing human traits, and the possibility of creating 'designer babies'. The paper also discusses the regulatory frameworks needed to ensure the responsible use of gene editing technologies.",
    "",
    "",
    "Climate change is expected to have significant impacts on global agriculture, affecting crop yields, food security, and farming practices. This paper reviews the potential effects of climate change on agriculture, including changes in temperature, precipitation patterns, and the frequency of extreme weather events. The paper also explores adaptation strategies that can help mitigate the impacts of climate change on agriculture.",
    "Biotechnology has significant potential in addressing environmental challenges, including pollution control, waste management, and conservation efforts. This paper explores the various applications of biotechnology in environmental protection, such as the use of microbes to clean up oil spills, the development of biofuels, and the restoration of damaged ecosystems. The paper also examines the future potential of biotechnology in environmental sustainability.",
    "Artificial intelligence is increasingly being used in healthcare diagnostics, from image recognition to predictive analytics. This paper examines the role of AI in enhancing diagnostic accuracy, reducing errors, and improving patient outcomes. The paper also explores the ethical and regulatory challenges of integrating AI into clinical practice.",
    "",
    "As digital technologies continue to evolve, data privacy has become an increasingly important issue. This paper discusses the challenges of protecting personal data in a world where data is being collected and shared at an unprecedented scale. It explores current data privacy laws, such as GDPR, and examines the role of technology in safeguarding personal information.",
    "AI is increasingly being used to streamline healthcare administration, from appointment scheduling to patient record management. This paper explores how AI can improve efficiency and reduce administrative costs in healthcare settings. The paper also discusses the challenges of implementing AI in healthcare organizations, including integration with existing systems and staff training.",
    "Quantum computing promises to solve complex problems that are beyond the reach of classical computers. This paper explores the principles of quantum computing, including quantum entanglement and superposition, and discusses its potential applications in fields such as cryptography, optimization, and drug discovery. The challenges of building stable quantum computers are also addressed, alongside the future outlook for this transformative technology.",
    "",
    "Autonomous vehicles are poised to transform the transportation industry, promising safer, more efficient travel. This paper reviews the latest advancements in self-driving car technology, including machine learning algorithms, sensor fusion, and real-time decision-making systems. The challenges of achieving full autonomy, such as regulatory approval and public trust, are also discussed.",
    "Virtual reality (VR) is transforming the entertainment industry, offering immersive experiences in gaming, movies, and theme parks. This paper explores the growth of VR technology and its impact on how people consume entertainment. It also discusses the challenges of VR adoption, such as hardware costs, content creation, and user experience design.",
    "The need for efficient energy storage solutions is critical for transitioning to renewable energy sources. This paper reviews current energy storage technologies, including lithium-ion batteries, pumped hydro storage, and emerging technologies such as solid-state batteries. The paper also examines the environmental impact and scalability of various energy storage solutions.",
    "Artificial intelligence has significant potential to improve healthcare by assisting in diagnostics, treatment planning, and personalized medicine. This paper discusses the opportunities AI offers in healthcare, including improving patient outcomes and reducing healthcare costs. It also addresses the challenges of integrating AI into clinical practice, such as data privacy, algorithm bias, and regulatory hurdles.",
    "Biotechnology plays a crucial role in improving agricultural productivity and sustainability. This paper explores the use of genetically modified crops, plant breeding techniques, and biofertilizers to enhance crop yields and reduce the environmental impact of agriculture. The paper also discusses the ethical and regulatory concerns surrounding biotechnology in agriculture.",
    "Climate change is exacerbating water scarcity around the world, affecting billions of people. This paper examines the link between climate change and water availability, focusing on the impacts of droughts, changing precipitation patterns, and melting glaciers. The paper also discusses strategies for managing water resources in the face of these challenges, including water conservation, desalination, and improved irrigation techniques.",
    "Machine learning techniques are increasingly being used in financial forecasting to predict stock prices, market trends, and economic indicators. This paper reviews the use of machine learning algorithms, such as regression analysis, decision trees, and neural networks, in financial markets. The paper also explores the challenges of model accuracy, data quality, and market volatility in financial forecasting.",
    "Artificial intelligence is increasingly being used in creative fields such as music composition, art generation, and content creation. This paper explores the role of AI in enhancing human creativity, including AI-assisted design tools and generative algorithms. The paper also discusses the potential risks of AI replacing human creativity and the ethical implications of AI-generated content.",
    "",
    "Robotic process automation (RPA) is transforming business operations by automating repetitive tasks and improving efficiency. This paper explores the potential applications of RPA in various industries, including finance, healthcare, and manufacturing. The paper also discusses the challenges of implementing RPA, such as integration with legacy systems and employee resistance to change.",
    "",
    "E-commerce has grown rapidly with the advent of digital technologies, transforming the way businesses and consumers interact. This paper reviews the evolution of e-commerce, from traditional online shopping to the rise of mobile commerce, social commerce, and personalized shopping experiences. The paper also discusses the future of e-commerce, including the role of artificial intelligence, virtual reality, and blockchain in shaping the online shopping experience.",
    "Wearable technology, including smartwatches, fitness trackers, and health monitoring devices, is transforming how individuals track their health and well-being. This paper explores the current state of wearable technology, including its use in monitoring vital signs, sleep patterns, and physical activity. It also discusses the potential for wearable devices to revolutionize healthcare by enabling remote patient monitoring and personalized health interventions.",
    "Autonomous systems, from self-driving cars to drones and robots, are rapidly becoming part of everyday life. This paper reviews the advancements in autonomous system technologies, focusing on their potential to improve efficiency, safety, and accessibility in various sectors. It also addresses the ethical and societal challenges posed by the widespread adoption of autonomous systems, including safety, accountability, and regulation.",
];

const YEARS = [1999, 2014, 2016, 2019, 2020, 2021, 2022, 2023, 2024];
const PUBLISHER = [
    "Springer",
    "IEEE",
    "ACM",
    "Elsevier",
    "Wiley",
    "Taylor & Francis",
    "MIT Press",
    "Cambridge University Press",
    "Oxford University Press",
    "CRC Press",
];
const PUBLICATION_NAMES = [
    "Journal of Artificial Intelligence Research",
    "",
    "Journal of Data Science",
    "AI in Healthcare Journal",
    "AI Ethics Review",
    "Journal of Blockchain Technology",
    "Global Energy Review",
    "Transportation Today",
    "Journal of Financial Technology",
    "IoT Security Journal",
    "Journal of Machine Learning Research",
    "AI & Society",
    "Journal of Cybersecurity",
    "Healthcare Data Review",
    "Journal of Educational Technology",
    "",
    "Journal of Neuroscience",
    "Telecommunications Review",
    "",
    "Ethics in Biotechnology",
    "Business Technology Review",
    "Urban Technology Journal",
    "",
    "Environmental Biotechnology Journal",
    "Healthcare AI Review",
    "Automation & Society",
    "Journal of Digital Privacy",
    "Healthcare Administration Review",
    "Quantum Computing Review",
    "Blockchain Journal",
    "",
    "Entertainment Technology Review",
    "Sustainable Energy Review",
    "AI & Healthcare Journal",
    "",
    "Global Environmental Change",
    "",
    "",
    "",
    "Automation in Business Journal",
    "Journal of Drug Discovery and Development",
    "E-Commerce Trends Journal",
    "Wearable Tech Journal",
    "",
];
const PUBLICATION_TYPES = [
    "Journal Article",
    "Book",
    "Conference Paper",
    "Magazine Article",
    "Newspaper Article",
    "Research Report",
    "White Paper",
    "Thesis/Dissertation",
    "Blog Post",
    "Online Article",
];

const PAPER_IDS: string[] = Array.from({ length: PAPER_TITLES.length }).map((_, i) => `${i}`);
const papers: Paper[] = [];

assert(
    PAPER_DOIS.length >= PAPER_TITLES.length,
    "There must be must at least as much paper dois as paper titles.",
);
assert(
    PAPER_ABSTRACTS.length >= PAPER_TITLES.length,
    "There must be must at least as much paper abstracts as paper titles.",
);
assert(
    PUBLICATION_NAMES.length >= PAPER_TITLES.length,
    "There must be must at least as much publication names as paper titles.",
);
assert(PAPER_IDS.length >= 10, "There must be must at least paper (titles).");
for (const [index, paperTitle] of PAPER_TITLES.entries()) {
    papers.push({
        id: `${index}`,
        externalId: PAPER_DOIS[index],
        title: paperTitle,
        abstrakt: PAPER_ABSTRACTS[index],
        year: getRandomItems(YEARS)[0],
        publisher: getRandomItems(PUBLISHER)[0],
        publicationName: PUBLICATION_NAMES[index],
        publicationType: getRandomItems(PUBLICATION_TYPES)[0],
        hasPdf: random() < 0.6,
        authors: getRandomItems(AUTHORS, 0, 4),
        backwardReferencedIds: getRandomItems(PAPER_IDS, 3, 10),
    });
}

const userSettings: Map<User, UserSettings> = new Map();
for (const user of USERS) {
    userSettings.set(user, {
        showHotkeys: random() < 0.5,
        reviewMode: random() < 0.8,
        defaultProjectSettings: getRandomItems(projectSettings)[0],
        defaultCriteria: { criteria: getRandomItems(CRITERIA, 2, 4) },
    });
}

const invitations: Map<User, Project[]> = new Map();
for (const user of USERS) {
    const selectedProjects = getRandomItems(projects, 0, 2).filter((project) => {
        // Filter out projects where the user is already a member
        const membersOfProject = projectMembers.find((p) => p.projectId === project.id);
        return membersOfProject?.members.some((member) => member.user?.id === user.id) === false;
    });
    invitations.set(user, selectedProjects);
}

const readingLists: Map<User, Paper[]> = new Map();
for (const user of USERS) {
    readingLists.set(user, getRandomItems(papers, 4, 10));
}

const reviews: Review[] = [];
for (let i = 0; i < NUMBER_OF_REVIEWS; i++) {
    const selectedCriteria = getRandomItems(CRITERIA, 2, 4);
    let decision = ReviewDecision.ACCEPTED;
    if (
        selectedCriteria.filter(
            (criterion) => criterion.category === CriterionCategory.HARD_EXCLUSION,
        ).length > 0
    ) {
        decision = ReviewDecision.DECLINED;
    } else if (
        selectedCriteria.filter((criterion) => criterion.category === CriterionCategory.EXCLUSION)
            .length > 0 &&
        selectedCriteria.filter((criterion) => criterion.category === CriterionCategory.INCLUSION)
            .length > 0
    ) {
        decision = ReviewDecision.MAYBE;
    }

    reviews.push({
        id: `${i}`,
        userId: `${getRandomItems(USERS)[0].id}`,
        decision: decision,
        selectedCriteriaIds: selectedCriteria.map((criterion) => criterion.id),
    });
}

const projectPapers: Project_Paper[] = [];
for (const [index, paper] of papers.entries()) {
    const reviewsOfPaper = random() < 0.5 ? getRandomItems(reviews, 1, 3) : [];

    const acceptingReviews = reviewsOfPaper.filter(
        (review) => review.decision === ReviewDecision.ACCEPTED,
    );
    const decliningReviews = reviewsOfPaper.filter(
        (review) => review.decision === ReviewDecision.DECLINED,
    );

    let decision;
    if (reviewsOfPaper.length === 0) {
        decision = PaperDecision.UNREVIEWED;
    } else if (acceptingReviews.length > decliningReviews.length) {
        decision = PaperDecision.ACCEPTED;
    } else if (acceptingReviews.length == decliningReviews.length) {
        decision = PaperDecision.IN_REVIEW;
    } else {
        decision = PaperDecision.DECLINED;
    }
    projectPapers.push({
        id: `${index}`,
        localId: `${index}`,
        paper: paper,
        stage: random() < 0.3 ? 0n : BigInt(Math.floor(random() * 2.5) + 1),
        decision: decision,
        reviews: reviewsOfPaper,
    });
}

export const exampleData: ExampleData = {
    availableFetchers: AVAILABLE_FETCHERS,
    users: USERS,
    readingLists: readingLists,
    userSettings: userSettings,
    invitations: invitations,
    projects: projects,
    projectMembers: projectMembers,
    criteria: CRITERIA,
    papers: papers,
    reviews: reviews,
    projectPapers: projectPapers,
};
