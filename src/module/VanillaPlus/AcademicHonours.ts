export type AcademicHonourSubject = 'science' | 'maths' | 'english' | 'history';

class AcademicHonours {
  public has(subject: AcademicHonourSubject): boolean {
    switch (subject) {
      case 'science':
        return V.scienceprojectwon === 1;
      case 'maths':
        return V.mathsprojectwon === 1;
      case 'english':
        return V.englishPlayWell === 1;
      case 'history':
        return V.VanillaPlus?.historyProject?.status === 'won';
    }
  }
}

export default AcademicHonours;
