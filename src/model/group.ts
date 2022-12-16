export class Group {

    id!: number;

    createdTime: number = Date.now();

    botEnabled: boolean = false;

    usersId: number[] = [];
}
