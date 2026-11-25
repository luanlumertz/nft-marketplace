// Credenciais fictícias: hashes PBKDF2-SHA256, 100.000 iterações e salts individuais.
export const userFixtures = [
  {
    id: 'ana',
    name: 'Ana Costa',
    email: 'ana@kurio.demo',
    salt: '17807c1c9f1b46b3a5e0d710c8071e6a',
    passwordHash:
      'c1b92794b1f1aabba4b2214c4624a8c43ad9c3b98bc14813ab409a53f51ecbda',
  },
  {
    id: 'bruno',
    name: 'Bruno Lima',
    email: 'bruno@kurio.demo',
    salt: '26807c1c9f1b46b3a5e0d710c8071e6b',
    passwordHash:
      'ff10020c4891c9e998fb9f91eda8bf030ae9d3fe1c2a889e1519e52ceb48efbf',
  },
]
