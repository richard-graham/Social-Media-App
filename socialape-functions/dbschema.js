let db = {
  users: [
    {
      userId: 'EAY8Cnvou6YpVhIfDcpw0AmnNCA3',
      email: 'test@test.co.nz',
      handle: 'test',
      createdAt: '2019-04-05T08:21:24.727Z',
      imageUrl: 'image/asiudhfsjkhbrdvs',
      bio: 'Hello my name is test',
      website: 'https://www.test.co.nz',
      location: 'Auckland, Nz'
    }
  ],
  screams: [
    {
      userHandle: 'user',
      body: 'This is the scream body',
      createdAt: '2019-04-05T04:22:34.682Z',
      likeCount: 5,
      commentCount: 2,
    }
  ],
  comments: [
    {
      userHandle: 'user',
      screamId: 'V7FPlNusm9xFwFoVsKAZ',
      body: 'This is a comment on a scream',
      createdAt: '2019-04-05T04:22:34.682Z'
    }
  ]
}
const userDetails = {
  //Redux data
  credentials: {
    userId: 'EAY8Cnvou6YpVhIfDcpw0AmnNCA3',
    email: 'test@test.co.nz',
    handle: 'test',
    createdAt: '2019-04-05T08:21:24.727Z',
    imageUrl: 'image/asiudhfsjkhbrdvs',
    bio: 'Hello my name is test',
    website: 'https://www.test.co.nz',
    location: 'Auckland, Nz'
  },
  likes: [
    {
      userHandle: 'user',
      screamId: 'PFa1hnl1VAeplBlp8uZj'
    },
    {
      userHandle: 'user2',
      screamId: 'V7FPlNusm9xFwFoVsKAZ'
    },
  ]
}