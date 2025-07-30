#include<iostream>
using namespace std;

char convert(long inS){
    int d,h,m,s;
    d=inS/60/60/24;
    h=(inS%(60*60*24))/60/60;
    m=inS/60%60;
    s=inS%60;
    cout<<inS<<" second(s) equals "<<d<<"day(s)"<<h<<"hour(s)"<<m<<"minute(s)"<<s<<"second(s)";
}

main(){
    long iS;
    cin>>iS;
    cout<<convert(iS);
    return 0;
}
