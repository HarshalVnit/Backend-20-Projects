#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

// TYPE DEFINITIONS
typedef enum { false, true } bool;
typedef enum { FAILURE, SUCCESS } Status_Code;
typedef enum { BY_TITLE, BY_ARTIST, BY_ARTIST_TITLE } SortType;

#define MAX_TITLE_LEN  100
#define MAX_ARTIST_LEN 100

// NODE / LIST STRUCTURE
typedef struct SongNode_Tag {
    int    songID;
    char   title[MAX_TITLE_LEN];
    char   artist[MAX_ARTIST_LEN];
    struct SongNode_Tag *next;
    struct SongNode_Tag *prev;
} SongNode;

typedef struct Playlist_Tag {
    SongNode *head;
    SongNode *tail;
    SongNode *current;   /* currently "playing" node */
    int       size;
    bool      repeat_mode;
    bool      shuffle_mode;
} Playlist;

/* ── Custom string copy to adhere STRICTLY to allowed functions ── */
static void copyString(char *dest, const char *src, int max_len) {
    int i = 0;
    while (src[i] != '\0' && i < max_len - 1) {
        dest[i] = src[i];
        i++;
    }
    dest[i] = '\0';
}

/* ── History SLL Node ── */
typedef struct HistoryNode_Tag {
    int    songID;
    char   title[MAX_TITLE_LEN];
    char   artist[MAX_ARTIST_LEN];
    struct HistoryNode_Tag *next;
} HistoryNode;

/* ── History List Wrapper ── */
typedef struct HistoryList_Tag {
    HistoryNode *head;
    int          size;
} HistoryList;

/* ── create a song node ── */
static SongNode *createNode(int id, const char *title, const char *artist) {
    SongNode *node = (SongNode *)malloc(sizeof(SongNode));

    if (!node) {
        printf("ERROR: Memory allocation failed.\n");
    } else {
        node->songID = id;
        strncpy(node->title,  title,  MAX_TITLE_LEN  - 1);
        strncpy(node->artist, artist, MAX_ARTIST_LEN - 1);
        node->title [MAX_TITLE_LEN  - 1] = '\0';
        node->artist[MAX_ARTIST_LEN - 1] = '\0';
        node->next = node->prev = NULL;
    }

    return node;   /* single return — NULL on failure, valid ptr on success */
}

/* ── create an empty playlist ── */
Playlist *createPlaylist(void) {
    Playlist *pl = (Playlist *)malloc(sizeof(Playlist));

    if (!pl) {
        printf("ERROR: Memory allocation failed.\n");
    } else {
        pl->head = pl->tail = pl->current = NULL;
        pl->size         = 0;
        pl->repeat_mode  = false;
        pl->shuffle_mode = false;
    }

    return pl;   /* single return */
}

/* ── add song, keep playlist sorted by SongID ── */
Status_Code addSong(Playlist *pl, int id, const char *title, const char *artist) {

    Status_Code status = SUCCESS;   /* optimistic default */
    SongNode   *node   = NULL;
    SongNode   *temp   = NULL;

    if (!pl) {
        printf("ERROR: Playlist is NULL.\n");
        status = FAILURE;

    } else if (pl->head == NULL) {
        /* ── CASE 1: empty list ── */
        node = createNode(id, title, artist);
        if (!node) {
            status = FAILURE;
        } else {
            pl->head = pl->tail = pl->current = node;
            pl->size++;
            printf("SUCCESS: Song [ID %d] \"%s\" added to playlist.\n", id, title);
        }

    } else {
        /* ── CASE 2 & 3: non-empty list, find sorted position ── */
        temp = pl->head;

        /* scan until duplicate found, or a larger ID is found, or list ends */
        while (temp != NULL && temp->songID < id) {
            temp = temp->next;
        }

        if (temp != NULL && temp->songID == id) {
            /* duplicate */
            printf("FAILURE: Song with ID %d already exists in the playlist.\n", id);
            status = FAILURE;

        } else {
            /* insert before temp  (temp == NULL means insert at tail) */
            node = createNode(id, title, artist);
            if (!node) {
                status = FAILURE;
            } else {
                if (temp == NULL) {
                    /* ── CASE 3: new tail ── */
                    node->prev     = pl->tail;
                    pl->tail->next = node;
                    pl->tail       = node;

                } else if (temp->prev == NULL) {
                    /* ── CASE 2a: new head ── */
                    node->next  = pl->head;
                    pl->head->prev = node;
                    pl->head    = node;

                } else {
                    /* ── CASE 2b: mid-list ── */
                    node->prev         = temp->prev;
                    node->next         = temp;
                    temp->prev->next   = node;
                    temp->prev         = node;
                }

                pl->size++;
                printf("SUCCESS: Song [ID %d] \"%s\" added to playlist.\n", id, title);
            }
        }
    }

    return status;   
}
// Since Play History also needs the song data (Title, Artist to display), and it's a separate linked list — Play History will make its own copy of the song data when a song is played.
// So in deleteSong — we do free() the node. Clean and simple.
//deleteSong
Status_Code deleteSong(Playlist *pl, int id) {

    Status_Code status = FAILURE;
    SongNode   *temp   = pl->head;

    if (!pl) {
        printf("ERROR: Playlist is NULL.\n");

    } else if (pl->head == NULL) {
        printf("FAILURE: Playlist is empty.\n");

    } else {

        /* traverse with early stop using sorted property */
        while (temp != NULL && temp->songID < id) {
            temp = temp->next;
        }

        if (temp == NULL || temp->songID != id) {
            printf("FAILURE: Song with ID %d not found.\n", id);

        } else {

            /* fix current pointer if deleted node is currently playing */
            if (pl->current == temp) {
                if (temp->next != NULL)
                    pl->current = temp->next;
                else if (temp->prev != NULL)
                    pl->current = temp->prev;
                else
                    pl->current = NULL;   /* playlist becomes empty */
            }

            /* ── CASE 1: single node ── */
            if (pl->head == pl->tail) {
                pl->head = pl->tail = pl->current = NULL;

            /* ── CASE 2: head node ── */
            } else if (temp == pl->head) {
                pl->head       = temp->next;
                pl->head->prev = NULL;

            /* ── CASE 3: tail node ── */
            } else if (temp == pl->tail) {
                pl->tail       = temp->prev;
                pl->tail->next = NULL;

            /* ── CASE 4: mid node ── */
            } else {
                //short but good logic 
                temp->prev->next = temp->next;
                temp->next->prev = temp->prev;
            }

            free(temp);
            pl->size--;
            printf("SUCCESS: Song [ID %d] deleted from playlist.\n", id);
            status = SUCCESS;
        }
    }

    return status; 
}


/* ── single merge function for all sort types ── */
static void merge(SongNode **arr, int left, int mid, int right, SortType sortType) {
    int i, j, k;
    int n1        = mid - left + 1;
    int n2        = right - mid;
    int artistCmp = 0;
    int condition = 0;

    SongNode **L = (SongNode **)malloc(n1 * sizeof(SongNode *));
    SongNode **R = (SongNode **)malloc(n2 * sizeof(SongNode *));

    if (!L || !R) {
        printf("ERROR: Memory allocation failed.\n");
        free(L);
        free(R);
        return;
    }

    for (i = 0; i < n1; i++) L[i] = arr[left + i];
    for (j = 0; j < n2; j++) R[j] = arr[mid + 1 + j];

    i = 0; j = 0; k = left;

    while (i < n1 && j < n2) {

        if (sortType == BY_TITLE) {
            condition = strcmp(L[i]->title, R[j]->title) <= 0;

        } else if (sortType == BY_ARTIST) {
            condition = strcmp(L[i]->artist, R[j]->artist) <= 0;

        } else {
            /* BY_ARTIST_TITLE — same artist then compare title */
            artistCmp = strcmp(L[i]->artist, R[j]->artist);
            condition = artistCmp < 0 || (artistCmp == 0 && strcmp(L[i]->title, R[j]->title) <= 0);
        }

        if (condition)
            arr[k++] = L[i++];
        else
            arr[k++] = R[j++];
    }

    while (i < n1) arr[k++] = L[i++];
    while (j < n2) arr[k++] = R[j++];

    free(L);
    free(R);
}

/* ── single mergeSort for all sort types ── */
static void mergeSort(SongNode **arr, int left, int right, SortType sortType) {
    int mid;
    if (left < right) {
        mid = left + (right - left) / 2;
        mergeSort(arr, left,    mid,   sortType);
        mergeSort(arr, mid + 1, right, sortType);
        merge    (arr, left,    mid,   right, sortType);
    }
}

/* ── print a single song ── */
static void printSong(SongNode *node) {
    printf("ID     : %d\n",   node->songID);
    printf("Title  : %s\n",   node->title);
    printf("Artist : %s\n\n", node->artist);
}

/* ── main display function ── */
Status_Code displayPlaylist(Playlist *pl, int choice) {

    Status_Code  status = SUCCESS;
    SongNode   **arr    = NULL;
    SongNode    *temp   = NULL;
    SortType     sortType;
    int          i      = 0;

    if (!pl) {
        printf("ERROR: Playlist is NULL.\n");
        status = FAILURE;

    } else if (pl->head == NULL) {
        printf("Playlist is empty.\n");
        status = FAILURE;

    } else {

        if (choice == 1) {
            /* sorted by SongID — DLL already sorted, just traverse */
            printf("===== PLAYLIST sorted by SongID =====\n\n");
            temp = pl->head;
            while (temp != NULL) {
                printSong(temp);
                temp = temp->next;
            }

        } else {

            /* for title/artist — build temp array, sort, display */
            arr = (SongNode **)malloc(pl->size * sizeof(SongNode *));
            if (!arr) {
                printf("ERROR: Memory allocation failed.\n");
                status = FAILURE;

            } else {

                /* fill array with pointers from DLL */
                temp = pl->head;
                while (temp != NULL) {
                    arr[i++] = temp;
                    temp = temp->next;
                }

                if (choice == 2) {
                    sortType = BY_TITLE;
                    printf("===== PLAYLIST sorted by Title =====\n\n");
                } else if (choice == 3) {
                    sortType = BY_ARTIST;
                    printf("===== PLAYLIST sorted by Artist =====\n\n");
                } else {
                    sortType = BY_ARTIST_TITLE;
                    printf("===== PLAYLIST sorted by Artist then Title =====\n\n");
                }

                mergeSort(arr, 0, pl->size - 1, sortType);

                for (i = 0; i < pl->size; i++)
                    printSong(arr[i]);

                free(arr);
            }
        }
    }

    return status;
}

Status_Code searchSong(Playlist *pl, int choice) {

    Status_Code  status  = SUCCESS;
    SongNode    *temp    = NULL;
    int          found   = 0;
    int          id      = 0;
    char         query[MAX_TITLE_LEN];

    if (!pl) {
        printf("ERROR: Playlist is NULL.\n");
        status = FAILURE;

    } else if (pl->head == NULL) {
        printf("Playlist is empty.\n");
        status = FAILURE;

    } else {

        if (choice == 1) {
            /* ── search by SongID ── */
            printf("Enter SongID to search: ");
            scanf("%d", &id);

            temp = pl->head;
            while (temp != NULL && temp->songID <= id) {
                if (temp->songID == id) {
                    printf("===== SONG FOUND =====\n\n");
                    printSong(temp);
                    found = 1;
                }
                temp = temp->next;
            }

            if (!found) {
                printf("FAILURE: Song with ID %d not found.\n", id);
                status = FAILURE;
            }

        } else if (choice == 2) {
            /* ── search by Title ── */
            printf("Enter Title to search: ");
            scanf(" %[^\n]", query);

            temp = pl->head;
            while (temp != NULL) {
                if (strcmp(temp->title, query) == 0) {
                    if (!found)
                        printf("===== SONGS FOUND =====\n\n");
                    printSong(temp);
                    found = 1;
                }
                temp = temp->next;
            }

            if (!found) {
                printf("FAILURE: No song with title \"%s\" found.\n", query);
                status = FAILURE;
            }

        } else {
            /* ── search by Artist ── */
            printf("Enter Artist to search: ");
            scanf(" %[^\n]", query);

            temp = pl->head;
            while (temp != NULL) {
                if (strcmp(temp->artist, query) == 0) {
                    if (!found)
                        printf("===== SONGS FOUND =====\n\n");
                    printSong(temp);
                    found = 1;
                }
                temp = temp->next;
            }

            if (!found) {
                printf("FAILURE: No songs by artist \"%s\" found.\n", query);
                status = FAILURE;
            }
        }
    }

    return status;
}

Status_Code shufflePlaylist(Playlist *pl) {

    Status_Code  status = SUCCESS;
    SongNode   **arr    = NULL;
    SongNode    *temp   = NULL;
    SongNode    *swap   = NULL;
    int          i      = 0;
    int          j      = 0;

    if (!pl) {
        printf("ERROR: Playlist is NULL.\n");
        status = FAILURE;

    } else if (pl->head == NULL) {
        printf("Playlist is empty.\n");
        status = FAILURE;

    } else if (pl->size == 1) {
        printf("Only one song in playlist, nothing to shuffle.\n");
        printf("===== SHUFFLED PLAYLIST =====\n\n");
        printSong(pl->head);

    } else {

        arr = (SongNode **)malloc(pl->size * sizeof(SongNode *));
        if (!arr) {
            printf("ERROR: Memory allocation failed.\n");
            status = FAILURE;

        } else {

            /* fill array with pointers from DLL */
            temp = pl->head;
            while (temp != NULL) {
                arr[i++] = temp;
                temp = temp->next;
            }

            /* Fisher-Yates shuffle */
            srand((unsigned int)time(NULL));

            for (i = pl->size - 1; i > 0; i--) {
                j       = rand() % (i + 1);   /* random index from 0 to i */
                swap    = arr[i];
                arr[i]  = arr[j];
                arr[j]  = swap;
            }

            /* display shuffled order */
            printf("===== SHUFFLED PLAYLIST =====\n\n");
            for (i = 0; i < pl->size; i++)
                printSong(arr[i]);

            free(arr);
        }
    }

    return status;
}

/* ── toggle repeat mode ON/OFF ── */
Status_Code toggleRepeatMode(Playlist *pl) {
    Status_Code status = SUCCESS;

    if (!pl) {
        printf("ERROR: Playlist is NULL.\n");
        status = FAILURE;
    } else {
        if (pl->repeat_mode == true) {
            pl->repeat_mode = false;
            printf("SUCCESS: Repeat Mode is now OFF.\n");
        } else {
            pl->repeat_mode = true;
            printf("SUCCESS: Repeat Mode is now ON.\n");
        }
    }
    return status;
}

/* ── play the playlist (loops continuously if repeat_mode is ON) ── */
Status_Code playEntirePlaylist(Playlist *pl) {
    Status_Code status = SUCCESS;
    SongNode   *temp   = NULL;
    int         choice = 0;

    if (!pl) {
        printf("ERROR: Playlist is NULL.\n");
        status = FAILURE;
    } else if (pl->head == NULL) {
        printf("FAILURE: Playlist is empty. Nothing to play.\n");
        status = FAILURE;
    } else {
        do {
            printf("\n===== STARTING PLAYLIST =====\n\n");
            temp = pl->head;
            
            while (temp != NULL) {
                pl->current = temp; /* Update currently playing node */
                printf("Now Playing -> ");
                printSong(temp);    /* Reusing your existing printSong function */
                temp = temp->next;
            }
            
            printf("===== PLAYLIST FINISHED =====\n");

            if (pl->repeat_mode == true) {
                printf("\nRepeat Mode is ON.\n");
                printf("Enter 1 to STOP, or any other number to REPEAT: ");
                scanf("%d", &choice);
                
                if (choice == 1) {
                    printf("Stopping playback.\n");
                    break; /* Breaks out of the do-while loop naturally */
                }
            }
        } while (pl->repeat_mode == true);
    }
    
    return status;
}

//Extra play next and prev

/* ── play the next song in the playlist ── */
Status_Code playNext(Playlist *pl) {
    Status_Code status = SUCCESS;

    if (!pl) {
        printf("ERROR: Playlist is NULL.\n");
        status = FAILURE;
    } else if (pl->head == NULL) {
        printf("FAILURE: Playlist is empty.\n");
        status = FAILURE;
    } else {
        if (pl->current == NULL) {
            /* If nothing is playing, start from the beginning */
            pl->current = pl->head;
        } else if (pl->current->next != NULL) {
            /* Move to next */
            pl->current = pl->current->next;
        } else {
            /* Wrap around to head */
            pl->current = pl->head;
            printf("[Reached end of playlist. Wrapping to start]\n");
        }
        
        printf("===== PLAYING NEXT =====\n\n");
        printSong(pl->current);
    }
    
    return status;
}

/* ── play the previous song in the playlist ── */
Status_Code playPrevious(Playlist *pl) {
    Status_Code status = SUCCESS;

    if (!pl) {
        printf("ERROR: Playlist is NULL.\n");
        status = FAILURE;
    } else if (pl->head == NULL) {
        printf("FAILURE: Playlist is empty.\n");
        status = FAILURE;
    } else {
        if (pl->current == NULL) {
            /* If nothing is playing, default to tail (going backwards) */
            pl->current = pl->tail;
        } else if (pl->current->prev != NULL) {
            /* Move to previous */
            pl->current = pl->current->prev;
        } else {
            /* Wrap around to tail */
            pl->current = pl->tail;
            printf("[Reached start of playlist. Wrapping to end]\n");
        }
        
        printf("===== PLAYING PREVIOUS =====\n\n");
        printSong(pl->current);
    }
    
    return status;
}



/* ── Create empty play history ── */
HistoryList *createHistoryList(void) {
    HistoryList *hist = (HistoryList *)malloc(sizeof(HistoryList));
    if (!hist) {
        printf("ERROR: Memory allocation failed for History List.\n");
    } else {
        hist->head = NULL;
        hist->size = 0;
    }
    return hist;
}

/* ── Add played song to history (Inserts at Head) ── */
Status_Code addSongToHistory(HistoryList *hist, SongNode *playedSong) {
    Status_Code  status = SUCCESS;
    HistoryNode *newNode = NULL;

    if (!hist || !playedSong) {
        status = FAILURE;
    } else {
        newNode = (HistoryNode *)malloc(sizeof(HistoryNode));
        if (!newNode) {
            printf("ERROR: Memory allocation failed for History Node.\n");
            status = FAILURE;
        } else {
            /* Deep copy the data */
            newNode->songID = playedSong->songID;
            copyString(newNode->title, playedSong->title, MAX_TITLE_LEN);
            copyString(newNode->artist, playedSong->artist, MAX_ARTIST_LEN);
            
            /* Insert at head (LIFO / Stack behavior) */
            newNode->next = hist->head;
            hist->head    = newNode;
            hist->size++;
        }
    }
    return status;
}

/* ── Display latest to oldest (Standard Traversal) ── */
Status_Code displayHistoryReverseChronological(HistoryList *hist) {
    Status_Code  status = SUCCESS;
    HistoryNode *temp   = NULL;

    if (!hist) {
        printf("ERROR: History List is NULL.\n");
        status = FAILURE;
    } else if (hist->head == NULL) {
        printf("Play history is empty.\n");
        status = FAILURE;
    } else {
        printf("===== PLAY HISTORY (Latest to Oldest) =====\n\n");
        temp = hist->head;
        while (temp != NULL) {
            printf("ID     : %d\n",   temp->songID);
            printf("Title  : %s\n",   temp->title);
            printf("Artist : %s\n\n", temp->artist);
            temp = temp->next;
        }
    }
    return status;
}

/* ── Recursive helper to print oldest to latest ── */
static void printChronologicalHelper(HistoryNode *node) {
    if (node != NULL) {
        printChronologicalHelper(node->next);
        printf("ID     : %d\n",   node->songID);
        printf("Title  : %s\n",   node->title);
        printf("Artist : %s\n\n", node->artist);
    }
}

/* ── Display oldest to latest (Uses Recursion) ── */
Status_Code displayHistoryChronological(HistoryList *hist) {
    Status_Code status = SUCCESS;

    if (!hist) {
        printf("ERROR: History List is NULL.\n");
        status = FAILURE;
    } else if (hist->head == NULL) {
        printf("Play history is empty.\n");
        status = FAILURE;
    } else {
        printf("===== PLAY HISTORY (Oldest to Latest) =====\n\n");
        printChronologicalHelper(hist->head);
    }
    return status;
}

/* ── Helper: Silently append a copied node to the tail (O(1) time) ── */
static Status_Code appendToPlaylist(Playlist *result, SongNode *src) {
    Status_Code status = SUCCESS;
    SongNode   *node   = NULL;

    if (!result || !src) {
        status = FAILURE;
    } else {
        /* Assuming createNode is updated to not use strncpy, as discussed! */
        node = createNode(src->songID, src->title, src->artist);
        if (!node) {
            status = FAILURE;
        } else {
            if (result->head == NULL) {
                result->head = result->tail = result->current = node;
            } else {
                node->prev         = result->tail;
                result->tail->next = node;
                result->tail       = node;
            }
            result->size++;
        }
    }
    return status;
}

/* ── Union of two sorted playlists ── */
Status_Code unionPlaylists(Playlist *pl1, Playlist *pl2, Playlist *result) {
    Status_Code status = SUCCESS;
    SongNode   *p1     = NULL;
    SongNode   *p2     = NULL;

    if (!pl1 || !pl2 || !result) {
        printf("ERROR: One or more playlists are NULL.\n");
        status = FAILURE;
    } else {
        p1 = pl1->head;
        p2 = pl2->head;

        printf("===== GENERATING UNION PLAYLIST =====\n");

        /* Traverse both playlists simultaneously */
        while (p1 != NULL && p2 != NULL) {
            if (p1->songID < p2->songID) {
                appendToPlaylist(result, p1);
                p1 = p1->next;
            } else if (p2->songID < p1->songID) {
                appendToPlaylist(result, p2);
                p2 = p2->next;
            } else {
                /* Duplicate found! Add one, advance BOTH to skip the duplicate */
                appendToPlaylist(result, p1);
                p1 = p1->next;
                p2 = p2->next;
            }
        }

        /* Flush any remaining songs from pl1 */
        while (p1 != NULL) {
            appendToPlaylist(result, p1);
            p1 = p1->next;
        }

        /* Flush any remaining songs from pl2 */
        while (p2 != NULL) {
            appendToPlaylist(result, p2);
            p2 = p2->next;
        }
        
        printf("SUCCESS: Union complete. Resulting playlist size: %d\n\n", result->size);
    }

    return status;
}

/* ── Intersection of two sorted playlists ── */
Status_Code intersectPlaylists(Playlist *pl1, Playlist *pl2, Playlist *result) {
    Status_Code status = SUCCESS;
    SongNode   *p1     = NULL;
    SongNode   *p2     = NULL;

    if (!pl1 || !pl2 || !result) {
        printf("ERROR: One or more playlists are NULL.\n");
        status = FAILURE;
    } else {
        p1 = pl1->head;
        p2 = pl2->head;

        printf("===== GENERATING INTERSECTION PLAYLIST =====\n");

        while (p1 != NULL && p2 != NULL) {
            if (p1->songID < p2->songID) {
                p1 = p1->next; /* Skip p1, it's not in pl2 */
            } else if (p2->songID < p1->songID) {
                p2 = p2->next; /* Skip p2, it's not in pl1 */
            } else {
                /* Match found! Append and advance both */
                appendToPlaylist(result, p1);
                p1 = p1->next;
                p2 = p2->next;
            }
        }
        /* No flushing needed. If one list ends, intersection is impossible for the rest. */
        
        printf("SUCCESS: Intersection complete. Resulting playlist size: %d\n\n", result->size);
    }

    return status;
}

/* ── Difference of two sorted playlists (pl1 - pl2) ── */
Status_Code differencePlaylists(Playlist *pl1, Playlist *pl2, Playlist *result) {
    Status_Code status = SUCCESS;
    SongNode   *p1     = NULL;
    SongNode   *p2     = NULL;

    if (!pl1 || !pl2 || !result) {
        printf("ERROR: One or more playlists are NULL.\n");
        status = FAILURE;
    } else {
        p1 = pl1->head;
        p2 = pl2->head;

        printf("===== GENERATING DIFFERENCE PLAYLIST (PL1 - PL2) =====\n");

        while (p1 != NULL && p2 != NULL) {
            if (p1->songID < p2->songID) {
                /* p1 is unique so far, append it */
                appendToPlaylist(result, p1);
                p1 = p1->next;
            } else if (p2->songID < p1->songID) {
                /* p2 is smaller, just skip it as we only care about pl1 */
                p2 = p2->next;
            } else {
                /* Match found! This means p1 is in pl2, so SKIP BOTH */
                p1 = p1->next;
                p2 = p2->next;
            }
        }

        /* Flush any remaining songs from pl1 (since pl2 ran out, all remaining in pl1 are unique) */
        while (p1 != NULL) {
            appendToPlaylist(result, p1);
            p1 = p1->next;
        }
        
        printf("SUCCESS: Difference complete. Resulting playlist size: %d\n\n", result->size);
    }

    return status;
}

/* ── Symmetric Difference of two sorted playlists ── */
Status_Code symmetricDifferencePlaylists(Playlist *pl1, Playlist *pl2, Playlist *result) {
    Status_Code status = SUCCESS;
    SongNode   *p1     = NULL;
    SongNode   *p2     = NULL;

    if (!pl1 || !pl2 || !result) {
        printf("ERROR: One or more playlists are NULL.\n");
        status = FAILURE;
    } else {
        p1 = pl1->head;
        p2 = pl2->head;

        printf("===== GENERATING SYMMETRIC DIFFERENCE PLAYLIST =====\n");

        while (p1 != NULL && p2 != NULL) {
            if (p1->songID < p2->songID) {
                appendToPlaylist(result, p1);
                p1 = p1->next;
            } else if (p2->songID < p1->songID) {
                appendToPlaylist(result, p2);
                p2 = p2->next;
            } else {
                /* Match found! Exclude from symmetric difference, skip both */
                p1 = p1->next;
                p2 = p2->next;
            }
        }

        /* Flush remaining from pl1 */
        while (p1 != NULL) {
            appendToPlaylist(result, p1);
            p1 = p1->next;
        }

        /* Flush remaining from pl2 */
        while (p2 != NULL) {
            appendToPlaylist(result, p2);
            p2 = p2->next;
        }
        
        printf("SUCCESS: Symmetric Difference complete. Resulting size: %d\n\n", result->size);
    }

    return status;
}

//Main Function
int main(void) {
    /* ── Variable Declarations (C89 Standard) ── */
    Playlist    *pl1     = createPlaylist();
    Playlist    *pl2     = createPlaylist();
    Playlist    *result  = NULL;
    HistoryList *history = createHistoryList(); /* Using SLL HistoryList */
    Status_Code  status  = SUCCESS;
    
    int  choice      = -1;
    int  sub_choice  = 0;
    int  id          = 0;
    char title[MAX_TITLE_LEN];
    char artist[MAX_ARTIST_LEN];

    /* ── Auto-Populate Dummy Data for Quick Testing ── */
    printf("Initializing System and loading dummy data...\n");
    
    /* PL1: IDs 10, 20, 30, 40 */
    addSong(pl1, 10, "Bohemian Rhapsody", "Queen");
    addSong(pl1, 20, "Shape of You", "Ed Sheeran");
    addSong(pl1, 30, "Hotel California", "Eagles");
    addSong(pl1, 40, "Blinding Lights", "The Weeknd");

    /* PL2: IDs 20, 40, 50, 60 (Notice 20 & 40 are common with PL1) */
    addSong(pl2, 20, "Shape of You", "Ed Sheeran");
    addSong(pl2, 40, "Blinding Lights", "The Weeknd");
    addSong(pl2, 50, "Levitating", "Dua Lipa");
    addSong(pl2, 60, "Watermelon Sugar", "Harry Styles");

    printf("\nDummy data loaded! Welcome to the Music Playlist Manager.\n");

    /* ── Main Application Loop ── */
    while (choice != 0) {
        printf("\n=========================================\n");
        printf("               MAIN MENU                 \n");
        printf("=========================================\n");
        printf("  1. Add Song to Playlist 1\n");
        printf("  2. Delete Song from Playlist 1\n");
        printf("  3. Display Playlist 1\n");
        printf("  4. Search Song in Playlist 1\n");
        printf("  5. Shuffle Playlist 1\n");
        printf("-----------------------------------------\n");
        printf("  6. Play Next Song\n");
        printf("  7. Play Previous Song\n");
        printf("  8. Toggle Repeat Mode\n");
        printf("  9. Play Entire Playlist\n");
        printf("-----------------------------------------\n");
        printf(" 10. Show Play History (Latest First)\n");
        printf(" 11. Show Play History (Oldest First)\n");
        printf("-----------------------------------------\n");
        printf(" 12. Set Operations (PL1 & PL2)\n");
        printf("  0. Exit\n");
        printf("=========================================\n");
        printf("Enter your choice: ");
        scanf("%d", &choice);
        printf("\n");

        switch (choice) {
            case 1:
                printf("Enter Song ID: ");
                scanf("%d", &id);
                printf("Enter Title: ");
                scanf(" %[^\n]", title);
                printf("Enter Artist: ");
                scanf(" %[^\n]", artist);
                status = addSong(pl1, id, title, artist);
                break;

            case 2:
                printf("Enter Song ID to delete: ");
                scanf("%d", &id);
                status = deleteSong(pl1, id);
                break;

            case 3:
                printf("1. By ID | 2. By Title | 3. By Artist | 4. By Artist then Title\n");
                printf("Choose sort order: ");
                scanf("%d", &sub_choice);
                status = displayPlaylist(pl1, sub_choice);
                break;

            case 4:
                printf("1. By ID | 2. By Title | 3. By Artist\n");
                printf("Choose search method: ");
                scanf("%d", &sub_choice);
                status = searchSong(pl1, sub_choice);
                break;

            case 5:
                status = shufflePlaylist(pl1);
                break;

            case 6:
                status = playNext(pl1);
                if (status == SUCCESS && pl1->current != NULL) {
                    addSongToHistory(history, pl1->current); /* Auto-log to history */
                }
                break;

            case 7:
                status = playPrevious(pl1);
                if (status == SUCCESS && pl1->current != NULL) {
                    addSongToHistory(history, pl1->current); /* Auto-log to history */
                }
                break;

            case 8:
                status = toggleRepeatMode(pl1);
                break;

            case 9:
                status = playEntirePlaylist(pl1);
                if (status == SUCCESS && pl1->current != NULL) {
                    addSongToHistory(history, pl1->current);
                }
                break;

            case 10:
                status = displayHistoryReverseChronological(history);
                break;

            case 11:
                status = displayHistoryChronological(history);
                break;

            case 12:
                printf("1. Union | 2. Intersection | 3. Difference (PL1-PL2) | 4. Symmetric Difference\n");
                printf("Choose operation: ");
                scanf("%d", &sub_choice);
                
                result = createPlaylist(); /* Create a fresh playlist for the result */
                
                if (sub_choice == 1) {
                    status = unionPlaylists(pl1, pl2, result);
                } else if (sub_choice == 2) {
                    status = intersectPlaylists(pl1, pl2, result);
                } else if (sub_choice == 3) {
                    status = differencePlaylists(pl1, pl2, result);
                } else if (sub_choice == 4) {
                    status = symmetricDifferencePlaylists(pl1, pl2, result);
                } else {
                    printf("Invalid set operation choice.\n");
                }

                if (status == SUCCESS && (sub_choice >= 1 && sub_choice <= 4)) {
                    displayPlaylist(result, 1); /* Display the result sorted by ID */
                }
                
                /* Free the result playlist envelope to prevent memory leaks in the loop */
                free(result); 
                break;

            case 0:
                printf("Exiting Playlist Manager. Goodbye!\n");
                break;

            default:
                printf("Invalid choice. Please try again.\n");
        }
    }

    return 0; /* Single return for main */
}