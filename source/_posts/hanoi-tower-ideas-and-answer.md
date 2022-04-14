---
title: "Hanoi Tower: Ideas & Answer"
date: 2022-04-15 02:27:36
---

In the study of SICP (Structure and Interpretation of Computer Programs), there is a homework in [Lecture 1B, MIT 6.001 (1986)](https://youtu.be/V_7mmwpgJHU).

To solve the Hanoi Tower, there is a list of ideas from simple to hard that avoid you going to the wrong way.

- The thinking of recursive is split the problem into the small problem. In this case, move "n - 1" disks to a auxiliary rod. Then move the bottom disk to destination rod.
- You don't need to storage the number of disks on towers. Instead, use a single character to represent towers like 'A', 'B' and 'C' because you can only move one disk at once.
- Use a parameter as lefting disks to move. When you need to move the "bottom" disk, just print "A => C".

## Answer
```c
#include <stdio.h>

void hanoiTowers(int disks, char source, char auxiliary, char destination);

int main() {
    hanoiTowers(3, 'A', 'B', 'C');

    return 0;
}

void hanoiTowers(int disks, char source, char auxiliary, char destination) {
    if (disks == 0) {
        return;
    }

    // Move all disk besides bottom one.
    // Auxiliary tower as destination of above disks.
    // A B C   to   A B C
    // 3 0 0        1 2 0
    hanoiTowers(disks - 1, source, destination, auxiliary);
    // With these moving, there is `disks - 1` of disks on auxiliary tower

    // Then move last disk on source tower to destination tower
    // A B C   to   A B C
    // 1 2 0        0 2 1
    printf("%c => %c\n", source, destination);
    // Now source tower is empty

    // Move left disks to the destination tower on auxiliary tower
    // Use source tower as auxiliary
    // A B C   to   A B C
    // 0 2 1        0 0 3
    hanoiTowers(disks - 1, auxiliary, source, destination);
}
```
